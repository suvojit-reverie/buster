import React from 'react';
import { UsersBackButton } from './_LayoutHeaderAndSegment';
import { prefetchGetUser } from '@/api/buster-rest';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { LayoutHeaderAndSegment } from './_LayoutHeaderAndSegment';

export default async function Layout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { userId: string };
}) {
  const queryClient = await prefetchGetUser(params.userId);

  return (
    <div className="flex flex-col space-y-5 px-12 py-12">
      <UsersBackButton />
      <HydrationBoundary state={dehydrate(queryClient)}>
        {<LayoutHeaderAndSegment userId={params.userId}>{children}</LayoutHeaderAndSegment>}
      </HydrationBoundary>
    </div>
  );
}
