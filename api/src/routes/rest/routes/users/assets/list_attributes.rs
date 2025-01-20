use anyhow::Result;
use axum::extract::Path;
use axum::http::StatusCode;
use axum::Extension;
use diesel::{ExpressionMethods, JoinOnDsl, QueryDsl};
use diesel_async::RunQueryDsl;
use serde::Serialize;
use serde_json::Value;
use uuid::Uuid;

use crate::database::lib::get_pg_pool;
use crate::database::models::User;
use crate::database::schema::{users, users_to_organizations};
use crate::routes::rest::ApiResponse;
use crate::utils::user::user_info::get_user_organization_id;

#[derive(Debug, Serialize)]
pub struct AttributeInfo {
    pub name: String,
    pub value: String,
    pub read_only: bool,
}

pub async fn list_attributes(
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<ApiResponse<Vec<AttributeInfo>>, (StatusCode, &'static str)> {
    let attributes = match list_attributes_handler(user, id).await {
        Ok(attrs) => attrs,
        Err(e) => {
            tracing::error!("Error listing attributes: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error listing attributes",
            ));
        }
    };

    Ok(ApiResponse::JsonData(attributes))
}

async fn list_attributes_handler(user: User, user_id: Uuid) -> Result<Vec<AttributeInfo>> {
    let mut conn = get_pg_pool().get().await?;

    let user_orgnazation_id = match get_user_organization_id(&user_id).await {
        Ok(id) => id,
        Err(e) => {
            tracing::error!("Error getting user organization id: {:?}", e);
            return Err(anyhow::anyhow!("Error getting user organization id"));
        }
    };

    let auth_user_orgnazation_id = match user.attributes.get("organization_id") {
        Some(Value::String(id)) => Uuid::parse_str(id).unwrap(),
        Some(_) => return Err(anyhow::anyhow!("User organization id not found")),
        None => return Err(anyhow::anyhow!("User organization id not found")),
    };

    let auth_user_role = match user.attributes.get("role") {
        Some(Value::String(role)) => role,
        Some(_) => return Err(anyhow::anyhow!("User role not found")),
        None => return Err(anyhow::anyhow!("User role not found")),
    };

    if !["workspace_admin", "data_admin"].contains(&auth_user_role.as_str()) {
        return Err(anyhow::anyhow!("User is not authorized to list attributes"));
    };

    if auth_user_orgnazation_id != user_orgnazation_id {
        return Err(anyhow::anyhow!("User is not authorized to list attributes"));
    }

    let user_attributes = match users::table
        .filter(users::id.eq(user_id))
        .inner_join(users_to_organizations::table.on(users::id.eq(users_to_organizations::user_id)))
        .filter(users_to_organizations::organization_id.eq(user_orgnazation_id))
        .select(users::attributes)
        .first::<Value>(&mut *conn)
        .await
    {
        Ok(user) => user,
        Err(_) => return Err(anyhow::anyhow!("User not found")),
    };

    let mut attributes = Vec::new();

    for (key, value) in user_attributes.as_object().unwrap() {
        if let Some(value_str) = value.as_str() {
            attributes.push(AttributeInfo {
                name: key.to_string(),
                value: value_str.to_string(),
                read_only: false,
            });
        }
    }

    Ok(attributes)
}
