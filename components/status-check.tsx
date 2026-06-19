export async function StatusCheck() {
  try {
    const response = await fetch("/api/health", { next: { revalidate: 60 } })
    const text = await response.text()

    return (
      <div className="flex items-center space-x-2">
        <div className="h-3 w-3 rounded-full bg-green-500"></div>
        <div>
          <p className="font-medium">API Status: Online</p>
          <p className="text-sm text-muted-foreground">Response: {text}</p>
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-3 w-3 rounded-full bg-red-500"></div>
        <div>
          <p className="font-medium">API Status: Offline</p>
          <p className="text-sm text-muted-foreground">Error connecting to API</p>
        </div>
      </div>
    )
  }
}

