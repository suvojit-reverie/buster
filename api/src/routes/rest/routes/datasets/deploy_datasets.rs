use anyhow::{anyhow, Result};
use axum::{extract::Json, Extension};
use chrono::{DateTime, Utc};
use diesel::{upsert::excluded, ExpressionMethods, QueryDsl, SelectableHelper};
use diesel_async::RunQueryDsl;
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use serde_yaml;
use std::collections::{HashMap, HashSet};
use uuid::Uuid;

use crate::{
    database::{
        enums::DatasetType,
        lib::get_pg_pool,
        models::{DataSource, Dataset, DatasetColumn, EntityRelationship, User},
        schema::{data_sources, dataset_columns, datasets, entity_relationship},
    },
    routes::rest::ApiResponse,
    utils::{
        dataset::column_management::{get_column_types, update_dataset_columns},
        query_engine::{
            credentials::get_data_source_credentials,
            import_dataset_columns::{retrieve_dataset_columns, retrieve_dataset_columns_batch},
            write_query_engine::write_query_engine,
        },
        security::checks::is_user_workspace_admin_or_data_admin,
        stored_values::{process_stored_values_background, store_column_values, StoredValueColumn},
        user::user_info::get_user_organization_id,
        validation::{dataset_validation::validate_model, ValidationError, ValidationResult},
        ColumnUpdate, ValidationErrorType,
    },
};

#[derive(Debug, Deserialize)]
pub struct BusterConfig {
    pub data_source_name: Option<String>,
    pub schema: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct DeployDatasetsRequest {
    pub id: Option<Uuid>,
    pub data_source_name: String,
    pub env: String,
    #[serde(rename = "type")]
    pub type_: String,
    pub name: String,
    pub model: Option<String>,
    pub schema: String,
    pub database: Option<String>,
    pub description: String,
    pub sql_definition: Option<String>,
    pub entity_relationships: Option<Vec<DeployDatasetsEntityRelationshipsRequest>>,
    pub columns: Vec<DeployDatasetsColumnsRequest>,
    pub yml_file: Option<String>,
    pub database_identifier: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct DeployDatasetsColumnsRequest {
    pub name: String,
    pub description: String,
    pub semantic_type: Option<String>,
    pub expr: Option<String>,
    #[serde(rename = "type")]
    pub type_: Option<String>,
    pub agg: Option<String>,
    #[serde(default)]
    pub stored_values: bool,
}

#[derive(Debug, Deserialize)]
pub struct DeployDatasetsEntityRelationshipsRequest {
    pub name: String,
    pub expr: String,
    #[serde(rename = "type")]
    pub type_: String,
}

#[derive(Serialize)]
pub struct DeployDatasetsResponse {
    pub results: Vec<ValidationResult>,
    pub summary: DeploymentSummary,
}

#[derive(Serialize)]
pub struct DeploymentSummary {
    pub total_models: usize,
    pub successful_models: usize,
    pub failed_models: usize,
    pub successes: Vec<DeploymentSuccess>,
    pub failures: Vec<DeploymentFailure>,
}

#[derive(Serialize)]
pub struct DeploymentSuccess {
    pub model_name: String,
    pub data_source_name: String,
    pub schema: String,
}

#[derive(Serialize)]
pub struct DeploymentFailure {
    pub model_name: String,
    pub data_source_name: String,
    pub schema: String,
    pub errors: Vec<ValidationError>,
}

#[derive(Debug, Deserialize)]
pub struct BusterModel {
    pub version: i32,
    pub models: Vec<Model>,
}

#[derive(Debug, Deserialize)]
pub struct Model {
    pub name: String,
    pub data_source_name: Option<String>,
    pub database: Option<String>,
    pub schema: Option<String>,
    pub env: String,
    pub description: String,
    pub model: Option<String>,
    #[serde(rename = "type")]
    pub type_: String,
    pub entities: Vec<Entity>,
    pub dimensions: Vec<Dimension>,
    pub measures: Vec<Measure>,
}

#[derive(Debug, Deserialize)]
pub struct Entity {
    pub name: String,
    pub expr: String,
    #[serde(rename = "type")]
    pub entity_type: String,
}

#[derive(Debug, Deserialize)]
pub struct Dimension {
    pub name: String,
    pub expr: String,
    #[serde(rename = "type")]
    pub dimension_type: String,
    pub description: String,
    pub searchable: bool,
}

#[derive(Debug, Deserialize)]
pub struct Measure {
    pub name: String,
    pub expr: String,
    pub agg: String,
    pub description: String,
}

#[derive(Debug, Deserialize)]
pub struct BatchValidationRequest {
    pub datasets: Vec<DatasetValidationRequest>,
}

#[derive(Debug, Deserialize)]
pub struct DatasetValidationRequest {
    pub dataset_id: Option<Uuid>,
    pub name: String,
    pub schema: String,
    pub data_source_name: String,
    pub columns: Vec<DeployDatasetsColumnsRequest>,
}

#[derive(Debug, Serialize)]
pub struct BatchValidationResult {
    pub successes: Vec<DatasetValidationSuccess>,
    pub failures: Vec<DatasetValidationFailure>,
}

#[derive(Debug, Serialize)]
pub struct DatasetValidationSuccess {
    pub dataset_id: Uuid,
    pub name: String,
    pub schema: String,
    pub data_source_name: String,
}

#[derive(Debug, Serialize)]
pub struct DatasetValidationFailure {
    pub dataset_id: Option<Uuid>,
    pub name: String,
    pub schema: String,
    pub data_source_name: String,
    pub errors: Vec<ValidationError>,
}

// Main API endpoint function
pub async fn deploy_datasets(
    Extension(user): Extension<User>,
    Json(request): Json<Vec<DeployDatasetsRequest>>,
) -> Result<ApiResponse<DeployDatasetsResponse>, (StatusCode, String)> {
    let organization_id = match get_user_organization_id(&user.id).await {
        Ok(id) => id,
        Err(e) => {
            tracing::error!("Error getting user organization id: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error getting user organization id".to_string(),
            ));
        }
    };

    // Check permissions
    match is_user_workspace_admin_or_data_admin(&user, &organization_id).await {
        Ok(true) => (),
        Ok(false) => {
            return Err((
                StatusCode::FORBIDDEN,
                "Insufficient permissions".to_string(),
            ))
        }
        Err(e) => {
            tracing::error!("Error checking user permissions: {:?}", e);
            return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()));
        }
    }

    // Call handler function
    match handle_deploy_datasets(&user.id, request).await {
        Ok(result) => Ok(ApiResponse::JsonData(result)),
        Err(e) => {
            tracing::error!("Error in deploy_datasets: {:?}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
        }
    }
}

// Main handler function that contains all business logic
async fn handle_deploy_datasets(
    user_id: &Uuid,
    requests: Vec<DeployDatasetsRequest>,
) -> Result<DeployDatasetsResponse> {
    let results = deploy_datasets_handler(user_id, requests, false).await?;

    let successful_models = results.iter().filter(|r| r.success).count();
    let failed_models = results.iter().filter(|r| !r.success).count();

    let summary = DeploymentSummary {
        total_models: results.len(),
        successful_models,
        failed_models,
        successes: results
            .iter()
            .filter(|r| r.success)
            .map(|r| DeploymentSuccess {
                model_name: r.model_name.clone(),
                data_source_name: r.data_source_name.clone(),
                schema: r.schema.clone(),
            })
            .collect(),
        failures: results
            .iter()
            .filter(|r| !r.success)
            .map(|r| DeploymentFailure {
                model_name: r.model_name.clone(),
                data_source_name: r.data_source_name.clone(),
                schema: r.schema.clone(),
                errors: r.errors.clone(),
            })
            .collect(),
    };

    Ok(DeployDatasetsResponse { results, summary })
}

// Handler function that contains all the business logic
async fn deploy_datasets_handler(
    user_id: &Uuid,
    requests: Vec<DeployDatasetsRequest>,
    is_simple: bool,
) -> Result<Vec<ValidationResult>> {
    let organization_id = get_user_organization_id(user_id).await?;
    let mut conn = get_pg_pool().get().await?;
    let mut results = Vec::new();

    // Group requests by data source and database for efficient validation
    let mut data_source_groups: HashMap<(String, Option<String>), Vec<&DeployDatasetsRequest>> = HashMap::new();
    for req in &requests {
        data_source_groups
            .entry((req.data_source_name.clone(), req.database.clone()))
            .or_default()
            .push(req);
    }

    // Process each data source group
    for ((data_source_name, database), group) in data_source_groups {

        // Get data source
        let data_source = match data_sources::table
            .filter(data_sources::name.eq(&data_source_name))
            .filter(data_sources::env.eq(&group[0].env))
            .filter(data_sources::organization_id.eq(&organization_id))
            .filter(data_sources::deleted_at.is_null())
            .select(data_sources::all_columns)
            .first::<DataSource>(&mut conn)
            .await
        {
            Ok(ds) => ds,
            Err(_) => {
                for req in group {
                    let mut validation = ValidationResult::new(
                        req.name.clone(),
                        req.data_source_name.clone(),
                        req.schema.clone(),
                    );
                    validation.add_error(ValidationError::data_source_error(format!(
                        "Data source '{}' not found",
                        data_source_name
                    )));
                    results.push(validation);
                }
                continue;
            }
        };

        // Get credentials for the data source
        let credentials = match get_data_source_credentials(&data_source.secret_id, &data_source.type_, false).await {
            Ok(creds) => creds,
            Err(e) => {
                for req in group {
                    let mut validation = ValidationResult::new(
                        req.name.clone(),
                        req.data_source_name.clone(),
                        req.schema.clone(),
                    );
                    validation.add_error(ValidationError::data_source_error(format!(
                        "Failed to get data source credentials: {}",
                        e
                    )));
                    results.push(validation);
                }
                continue;
            }
        };

        // Prepare tables for batch validation
        let tables_to_validate: Vec<(String, String)> = group
            .iter()
            .map(|req| (req.name.clone(), req.schema.clone()))
            .collect();

        tracing::info!(
            "Validating tables for data source '{:?}.{:?}': {:?}",
            data_source_name,
            database,
            tables_to_validate
        );

        // Get all columns in one batch - this acts as our validation
        let ds_columns = match retrieve_dataset_columns_batch(&tables_to_validate, &credentials, database).await {
            Ok(cols) => {
                // Add debug logging
                tracing::info!(
                    "Retrieved {} columns for data source '{}'. Tables found: {:?}",
                    cols.len(),
                    data_source_name,
                    cols.iter()
                        .map(|c| format!("{}.{}", c.schema_name, c.dataset_name))
                        .collect::<HashSet<_>>()
                );
                cols
            },
            Err(e) => {
                tracing::error!(
                    "Error retrieving columns for data source '{}': {:?}",
                    data_source_name,
                    e
                );
                for req in group {
                    let mut validation = ValidationResult::new(
                        req.name.clone(),
                        req.data_source_name.clone(),
                        req.schema.clone(),
                    );
                    validation.add_error(ValidationError::data_source_error(format!(
                        "Failed to get columns from data source: {}",
                        e
                    )));
                    results.push(validation);
                }
                continue;
            }
        };

        // Create a map of valid datasets and their columns
        let mut valid_datasets = Vec::new();
        let mut dataset_columns_map: HashMap<String, Vec<_>> = HashMap::new();
        
        for req in group {
            let mut validation = ValidationResult::new(
                req.name.clone(),
                req.data_source_name.clone(),
                req.schema.clone(),
            );

            // Get columns for this dataset
            let columns: Vec<_> = ds_columns
                .iter()
                .filter(|col| {
                    let name_match = col.dataset_name.to_lowercase() == req.name.to_lowercase();
                    let schema_match = col.schema_name.to_lowercase() == req.schema.to_lowercase();
                    
                    // Add detailed debug logging for column matching
                    tracing::info!(
                        "Matching table '{}.{}': name_match={}, schema_match={} (comparing against {}.{})",
                        col.schema_name,
                        col.dataset_name,
                        name_match,
                        schema_match,
                        req.schema,
                        req.name
                    );
                    
                    name_match && schema_match
                })
                .collect();

            if columns.is_empty() {
                tracing::warn!(
                    "No columns found for dataset '{}' in schema '{}'. Available tables:\n{}",
                    req.name,
                    req.schema,
                    ds_columns
                        .iter()
                        .map(|c| format!("  - {}.{}", c.schema_name, c.dataset_name))
                        .collect::<Vec<_>>()
                        .join("\n")
                );
                validation.add_error(ValidationError::table_not_found(&format!(
                    "{}.{}",
                    req.schema,
                    req.name
                )));
                validation.success = false;
            } else {
                tracing::info!(
                    "✅ Found {} columns for dataset '{}.{}'",
                    columns.len(),
                    req.schema,
                    req.name
                );
                validation.success = true;
                valid_datasets.push(req);
                dataset_columns_map.insert(req.name.clone(), columns);
            }

            results.push(validation);
        }

        // Bulk upsert valid datasets
        if !valid_datasets.is_empty() {
            let now = Utc::now();
            
            // Get existing dataset IDs for this data source
            let existing_datasets: HashSet<String> = datasets::table
                .filter(datasets::data_source_id.eq(&data_source.id))
                .filter(datasets::deleted_at.is_null())
                .select(datasets::name)
                .load::<String>(&mut conn)
                .await?
                .into_iter()
                .collect();

            // Prepare datasets for upsert
            let datasets_to_upsert: Vec<Dataset> = valid_datasets
                .iter()
                .map(|req| Dataset {
                    id: req.id.unwrap_or_else(Uuid::new_v4),
                    name: req.name.clone(),
                    data_source_id: data_source.id,
                    created_at: now,
                    updated_at: now,
                    database_name: req.name.clone(),
                    when_to_use: Some(req.description.clone()),
                    when_not_to_use: None,
                    type_: DatasetType::View,
                    definition: req.sql_definition.clone().unwrap_or_default(),
                    schema: req.schema.clone(),
                    enabled: true,
                    created_by: user_id.clone(),
                    updated_by: user_id.clone(),
                    deleted_at: None,
                    imported: false,
                    organization_id: organization_id.clone(),
                    model: req.model.clone(),
                    yml_file: req.yml_file.clone(),
                    database_identifier: req.database.clone(),
                })
                .collect();

            // Bulk upsert datasets
            diesel::insert_into(datasets::table)
                .values(&datasets_to_upsert)
                .on_conflict((datasets::database_name, datasets::data_source_id))
                .do_update()
                .set((
                    datasets::updated_at.eq(excluded(datasets::updated_at)),
                    datasets::updated_by.eq(excluded(datasets::updated_by)),
                    datasets::definition.eq(excluded(datasets::definition)),
                    datasets::when_to_use.eq(excluded(datasets::when_to_use)),
                    datasets::model.eq(excluded(datasets::model)),
                    datasets::yml_file.eq(excluded(datasets::yml_file)),
                    datasets::schema.eq(excluded(datasets::schema)),
                    datasets::name.eq(excluded(datasets::name)),
                    datasets::deleted_at.eq(None::<DateTime<Utc>>),
                ))
                .execute(&mut conn)
                .await?;

            // Get the dataset IDs after upsert for column operations
            let dataset_ids: HashMap<String, Uuid> = datasets::table
                .filter(datasets::data_source_id.eq(&data_source.id))
                .filter(datasets::database_name.eq_any(valid_datasets.iter().map(|req| &req.name)))
                .filter(datasets::deleted_at.is_null())
                .select((datasets::database_name, datasets::id))
                .load::<(String, Uuid)>(&mut conn)
                .await?
                .into_iter()
                .collect();

            // Bulk upsert columns for each dataset
            for req in valid_datasets {
                let dataset_id = match dataset_ids.get(&req.name) {
                    Some(id) => *id,
                    None => {
                        tracing::error!(
                            "Dataset ID not found after upsert for {}.{}",
                            req.schema,
                            req.name
                        );
                        continue;
                    }
                };

                let columns: Vec<DatasetColumn> = req
                    .columns
                    .iter()
                    .map(|col| DatasetColumn {
                        id: Uuid::new_v4(),
                        dataset_id,
                        name: col.name.clone(),
                        type_: col.type_.clone().unwrap_or_else(|| "text".to_string()),
                        description: Some(col.description.clone()),
                        nullable: true,
                        created_at: now,
                        updated_at: now,
                        deleted_at: None,
                        stored_values: None,
                        stored_values_status: None,
                        stored_values_error: None,
                        stored_values_count: None,
                        stored_values_last_synced: None,
                        semantic_type: col.semantic_type.clone(),
                        dim_type: col.type_.clone(),
                        expr: col.expr.clone(),
                    })
                    .collect();

                // Get current column names
                let current_column_names: HashSet<String> = dataset_columns::table
                    .filter(dataset_columns::dataset_id.eq(dataset_id))
                    .filter(dataset_columns::deleted_at.is_null())
                    .select(dataset_columns::name)
                    .load::<String>(&mut conn)
                    .await?
                    .into_iter()
                    .collect();

                // Get new column names
                let new_column_names: HashSet<String> = columns
                    .iter()
                    .map(|c| c.name.clone())
                    .collect();

                // Soft delete removed columns
                let columns_to_delete: Vec<String> = current_column_names
                    .difference(&new_column_names)
                    .cloned()
                    .collect();

                if !columns_to_delete.is_empty() {
                    diesel::update(dataset_columns::table)
                        .filter(dataset_columns::dataset_id.eq(dataset_id))
                        .filter(dataset_columns::name.eq_any(&columns_to_delete))
                        .filter(dataset_columns::deleted_at.is_null())
                        .set(dataset_columns::deleted_at.eq(now))
                        .execute(&mut conn)
                        .await?;
                }

                // Bulk upsert columns
                diesel::insert_into(dataset_columns::table)
                    .values(&columns)
                    .on_conflict((dataset_columns::dataset_id, dataset_columns::name))
                    .do_update()
                    .set((
                        dataset_columns::type_.eq(excluded(dataset_columns::type_)),
                        dataset_columns::description.eq(excluded(dataset_columns::description)),
                        dataset_columns::semantic_type.eq(excluded(dataset_columns::semantic_type)),
                        dataset_columns::dim_type.eq(excluded(dataset_columns::dim_type)),
                        dataset_columns::expr.eq(excluded(dataset_columns::expr)),
                        dataset_columns::updated_at.eq(now),
                        dataset_columns::deleted_at.eq(None::<DateTime<Utc>>),
                    ))
                    .execute(&mut conn)
                    .await?;
            }
        }
    }

    Ok(results)
}

async fn batch_validate_datasets(
    user_id: &Uuid,
    requests: Vec<DatasetValidationRequest>,
) -> Result<BatchValidationResult> {
    let mut successes = Vec::new();
    let mut failures = Vec::new();
    let organization_id = get_user_organization_id(user_id).await?;

    // Group requests by data source and database for efficient validation
    let mut data_source_groups: HashMap<
        (String, Option<String>),
        Vec<(&DatasetValidationRequest, Vec<(&str, &str)>)>,
    > = HashMap::new();

    for request in &requests {
        let columns: Vec<(&str, &str)> = request
            .columns
            .iter()
            .map(|c| (c.name.as_str(), c.type_.as_deref().unwrap_or("text")))
            .collect();

        data_source_groups
            .entry((request.data_source_name.clone(), None)) // Using None for database since it's not in the validation request
            .or_default()
            .push((request, columns));
    }

    // Process each data source group
    for ((data_source_name, database), group) in data_source_groups {
        let mut conn = get_pg_pool().get().await?;

        // Get data source
        let data_source = match data_sources::table
            .filter(data_sources::name.eq(&data_source_name))
            .filter(data_sources::organization_id.eq(organization_id))
            .select(data_sources::all_columns)
            .first::<DataSource>(&mut conn)
            .await
        {
            Ok(ds) => ds,
            Err(e) => {
                for (request, _) in group {
                    failures.push(DatasetValidationFailure {
                        dataset_id: request.dataset_id,
                        name: request.name.clone(),
                        schema: request.schema.clone(),
                        data_source_name: request.data_source_name.clone(),
                        errors: vec![ValidationError::data_source_error(format!(
                            "Data source not found: {}",
                            e
                        ))],
                    });
                }
                continue;
            }
        };

        // Prepare tables for batch validation
        let tables_to_validate: Vec<(String, String)> = group
            .iter()
            .map(|(req, _)| (req.name.clone(), req.schema.clone()))
            .collect();

        // Get credentials
        let credentials =
            match get_data_source_credentials(&data_source.secret_id, &data_source.type_, false)
                .await
            {
                Ok(creds) => creds,
                Err(e) => {
                    for (request, _) in group {
                        failures.push(DatasetValidationFailure {
                            dataset_id: request.dataset_id,
                            name: request.name.clone(),
                            schema: request.schema.clone(),
                            data_source_name: request.data_source_name.clone(),
                            errors: vec![ValidationError::data_source_error(format!(
                                "Failed to get data source credentials: {}",
                                e
                            ))],
                        });
                    }
                    continue;
                }
            };

        // Get all columns in one batch
        let ds_columns =
            match retrieve_dataset_columns_batch(&tables_to_validate, &credentials, database).await {
                Ok(cols) => cols,
                Err(e) => {
                    for (request, _) in group {
                        failures.push(DatasetValidationFailure {
                            dataset_id: request.dataset_id,
                            name: request.name.clone(),
                            schema: request.schema.clone(),
                            data_source_name: request.data_source_name.clone(),
                            errors: vec![ValidationError::data_source_error(format!(
                                "Failed to get columns from data source: {}",
                                e
                            ))],
                        });
                    }
                    continue;
                }
            };

        // Validate each dataset in the group
        for (request, columns) in group {
            let mut validation_errors = Vec::new();

            // Filter columns for this dataset
            let dataset_columns: Vec<_> = ds_columns
                .iter()
                .filter(|col| col.dataset_name == request.name && col.schema_name == request.schema)
                .collect();

            if dataset_columns.is_empty() {
                validation_errors.push(ValidationError::table_not_found(&request.name));
            } else {
                // Validate each column exists
                for (col_name, _) in &columns {
                    if !dataset_columns.iter().any(|c| c.name == *col_name) {
                        validation_errors.push(ValidationError::column_not_found(col_name));
                    }
                }
            }

            if validation_errors.is_empty() {
                // Create or update dataset
                match create_or_update_dataset(request, &organization_id, user_id).await {
                    Ok(dataset_id) => {
                        successes.push(DatasetValidationSuccess {
                            dataset_id,
                            name: request.name.clone(),
                            schema: request.schema.clone(),
                            data_source_name: request.data_source_name.clone(),
                        });
                    }
                    Err(e) => {
                        failures.push(DatasetValidationFailure {
                            dataset_id: request.dataset_id,
                            name: request.name.clone(),
                            schema: request.schema.clone(),
                            data_source_name: request.data_source_name.clone(),
                            errors: vec![ValidationError::data_source_error(format!(
                                "Failed to create/update dataset: {}",
                                e
                            ))],
                        });
                    }
                }
            } else {
                failures.push(DatasetValidationFailure {
                    dataset_id: request.dataset_id,
                    name: request.name.clone(),
                    schema: request.schema.clone(),
                    data_source_name: request.data_source_name.clone(),
                    errors: validation_errors,
                });
            }
        }
    }

    Ok(BatchValidationResult {
        successes,
        failures,
    })
}

async fn create_or_update_dataset(
    request: &DatasetValidationRequest,
    organization_id: &Uuid,
    user_id: &Uuid,
) -> Result<Uuid> {
    let mut conn = get_pg_pool().get().await?;
    let now = Utc::now();

    let dataset_id = match request.dataset_id {
        Some(id) => {
            // Update existing dataset
            diesel::update(datasets::table)
                .filter(datasets::id.eq(id))
                .set((
                    datasets::name.eq(&request.name),
                    datasets::updated_at.eq(now),
                    datasets::updated_by.eq(user_id),
                ))
                .execute(&mut conn)
                .await?;
            id
        }
        None => {
            // Create new dataset
            let dataset = Dataset {
                id: Uuid::new_v4(),
                name: request.name.clone(),
                data_source_id: Uuid::new_v4(), // This needs to be set correctly
                created_at: now,
                updated_at: now,
                database_name: request.name.clone(),
                when_to_use: None,
                when_not_to_use: None,
                type_: DatasetType::View,
                definition: String::new(),
                schema: request.schema.clone(),
                enabled: false,
                created_by: user_id.clone(),
                updated_by: user_id.clone(),
                deleted_at: None,
                imported: false,
                organization_id: organization_id.clone(),
                yml_file: None,
                model: None,
                database_identifier: None,
            };

            diesel::insert_into(datasets::table)
                .values(&dataset)
                .execute(&mut conn)
                .await?;

            dataset.id
        }
    };

    // Create new columns
    let new_columns: Vec<DatasetColumn> = request
        .columns
        .iter()
        .map(|col| DatasetColumn {
            id: Uuid::new_v4(),
            dataset_id,
            name: col.name.clone(),
            type_: col.type_.clone().unwrap_or_else(|| "text".to_string()),
            description: Some(col.description.clone()),
            nullable: true, // This should be determined from the source
            created_at: now,
            updated_at: now,
            deleted_at: None,
            stored_values: None,
            stored_values_status: None,
            stored_values_error: None,
            stored_values_count: None,
            stored_values_last_synced: None,
            semantic_type: col.semantic_type.clone(),
            dim_type: None,
            expr: col.expr.clone(),
        })
        .collect();

    // Get current column names for this dataset
    let current_column_names: Vec<String> = dataset_columns::table
        .filter(dataset_columns::dataset_id.eq(dataset_id))
        .filter(dataset_columns::deleted_at.is_null())
        .select(dataset_columns::name)
        .load::<String>(&mut conn)
        .await?;

    // Soft delete columns that are no longer present
    let new_column_names: Vec<String> = new_columns.iter().map(|c| c.name.clone()).collect();
    diesel::update(dataset_columns::table)
        .filter(dataset_columns::dataset_id.eq(dataset_id))
        .filter(dataset_columns::deleted_at.is_null())
        .filter(dataset_columns::name.ne_all(&new_column_names))
        .set(dataset_columns::deleted_at.eq(now))
        .execute(&mut conn)
        .await?;

    // Insert new columns
    diesel::insert_into(dataset_columns::table)
        .values(&new_columns)
        .execute(&mut conn)
        .await?;

    Ok(dataset_id)
}
