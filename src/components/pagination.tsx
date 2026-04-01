"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  totalPages: number;
  baseHref: string;
};

export function Pagination({ page, totalPages, baseHref }: PaginationProps) {
  if (totalPages <= 1) return null;

  const linkClass = cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1");
  const disabledClass = cn(linkClass, "pointer-events-none opacity-50");

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      {page > 1 ? (
        <Link href={`${baseHref}?page=${page - 1}`} className={linkClass}>
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Link>
      ) : (
        <span className={disabledClass}>
          <ChevronLeft className="h-4 w-4" />
          Previous
        </span>
      )}

      <span className="text-sm text-muted-foreground px-2">
        Page {page} of {totalPages}
      </span>

      {page < totalPages ? (
        <Link href={`${baseHref}?page=${page + 1}`} className={linkClass}>
          Next
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className={disabledClass}>
          Next
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </div>
  );
}
