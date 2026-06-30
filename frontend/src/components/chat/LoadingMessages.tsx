import { Skeleton } from "@/components/ui/skeleton"

export function LoadingMessages() {
  return (
    <div className="flex flex-col gap-6 w-full p-4">
      {/* Incoming */}
      <div className="flex w-full justify-start gap-3">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        <div className="flex flex-col gap-1 items-start w-full">
          <Skeleton className="h-3 w-16 mb-1" />
          <Skeleton className="h-[40px] w-[60%] sm:w-[40%] rounded-2xl rounded-bl-sm" />
        </div>
      </div>
      
      {/* Outgoing */}
      <div className="flex w-full justify-end gap-3">
        <div className="flex flex-col gap-1 items-end w-full">
          <Skeleton className="h-[60px] w-[75%] sm:w-[50%] rounded-2xl rounded-br-sm" />
        </div>
      </div>

      {/* Incoming */}
      <div className="flex w-full justify-start gap-3">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        <div className="flex flex-col gap-1 items-start w-full">
          <Skeleton className="h-3 w-16 mb-1" />
          <Skeleton className="h-[40px] w-[45%] rounded-2xl rounded-bl-sm" />
        </div>
      </div>
    </div>
  )
}
