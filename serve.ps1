param(
  [int]$Port = 5173
)

$ErrorActionPreference = "Stop"

function Get-MimeType([string]$Path) {
  switch -Regex ($Path.ToLowerInvariant()) {
    "\.html$" { return "text/html; charset=utf-8" }
    "\.css$"  { return "text/css; charset=utf-8" }
    "\.js$"   { return "text/javascript; charset=utf-8" }
    "\.json$" { return "application/json; charset=utf-8" }
    "\.png$"  { return "image/png" }
    "\.jpg$"  { return "image/jpeg" }
    "\.jpeg$" { return "image/jpeg" }
    "\.svg$"  { return "image/svg+xml" }
    "\.ico$"  { return "image/x-icon" }
    default   { return "application/octet-stream" }
  }
}

$Root = (Resolve-Path ".").Path
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Start()

Write-Host "Serving $Root"
Write-Host "Open: http://localhost:$Port/"
Write-Host "Press Ctrl+C to stop."

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response

    $path = [Uri]::UnescapeDataString($req.Url.AbsolutePath.TrimStart("/"))
    if ([string]::IsNullOrWhiteSpace($path)) { $path = "index.html" }

    $full = Join-Path $Root $path

    if (-not (Test-Path $full -PathType Leaf)) {
      # SPA-ish fallback: for unknown paths serve index.html (hash routing anyway)
      $full = Join-Path $Root "index.html"
      if (-not (Test-Path $full -PathType Leaf)) {
        $res.StatusCode = 404
        $bytes = [Text.Encoding]::UTF8.GetBytes("Not found")
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
        $res.Close()
        continue
      }
    }

    $mime = Get-MimeType $full
    $res.Headers.Add("Cache-Control", "no-store")
    $res.ContentType = $mime

    $bytes = [IO.File]::ReadAllBytes($full)
    $res.ContentLength64 = $bytes.Length
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
    $res.Close()
  }
} finally {
  $listener.Stop()
  $listener.Close()
}

