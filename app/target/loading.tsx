export default function Loading() {
  return (
    <div className="py-8 max-w-md mx-auto text-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p>Loading target form...</p>
      </div>
    </div>
  )
}
