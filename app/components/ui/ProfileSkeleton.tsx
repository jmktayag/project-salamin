'use client';

import React from 'react';
import { Card } from './Card';

interface SkeletonProps {
  className?: string;
}

function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
}

interface ProfileSectionSkeletonProps {
  showContent?: boolean;
}

function ProfileSectionSkeleton({ showContent = false }: ProfileSectionSkeletonProps) {
  return (
    <Card className="mb-6">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-5 h-5" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="w-5 h-5" />
        </div>
      </div>
      {showContent && (
        <div className="px-6 pb-6 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <div className="flex items-center space-x-4">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <Skeleton className="h-2 w-1/3 rounded-full" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        {/* Profile Sections Skeleton */}
        <ProfileSectionSkeleton showContent={true} />
        <ProfileSectionSkeleton />
        <ProfileSectionSkeleton />
        <ProfileSectionSkeleton />
        <ProfileSectionSkeleton />

        {/* Save Button Skeleton */}
        <div className="flex justify-end">
          <Skeleton className="h-12 w-32" />
        </div>
      </div>
    </div>
  );
}

export function ProfileFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export { ProfileSectionSkeleton };