Add-Type -AssemblyName System.Runtime.WindowsRuntime

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetGenericArguments().Count -eq 1
})[0]

$asTaskGenericProgress = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetGenericArguments().Count -eq 2
})[0]

function Await($WinRtTask, $ResultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $netTask.Wait(-1) | Out-Null
    return $netTask.Result
}

function AwaitProgress($WinRtTask, $ResultType, $ProgressType) {
    $asTask = $asTaskGenericProgress.MakeGenericMethod($ResultType, $ProgressType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $netTask.Wait(-1) | Out-Null
    return $netTask.Result
}

[Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType=WindowsRuntime] | Out-Null
[Windows.Storage.Streams.DataReader, Windows.Storage.Streams, ContentType=WindowsRuntime] | Out-Null
[Windows.Storage.Streams.IInputStream, Windows.Storage.Streams, ContentType=WindowsRuntime] | Out-Null
[Windows.Storage.Streams.IRandomAccessStream, Windows.Storage.Streams, ContentType=WindowsRuntime] | Out-Null
[Windows.Storage.Streams.InMemoryRandomAccessStream, Windows.Storage.Streams, ContentType=WindowsRuntime] | Out-Null

$manager = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
$session = $null
foreach ($s in $manager.GetSessions()) { if ($s.SourceAppUserModelId -match 'Spotify') { $session = $s; break } }
$props = Await ($session.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
$sourceStream = Await ($props.Thumbnail.OpenReadAsync()) ([Windows.Storage.Streams.IRandomAccessStreamWithContentType])

Write-Host "--- Test A: cast to IInputStream then AsStreamForRead ---"
try {
    $asInputStream = [Windows.Storage.Streams.IInputStream]$sourceStream
    Write-Host "Cast to IInputStream succeeded: $($asInputStream.GetType().FullName)"
    $netStream = [System.IO.WindowsRuntimeStreamExtensions]::AsStreamForRead($asInputStream)
    $ms = New-Object System.IO.MemoryStream
    $netStream.CopyTo($ms)
    Write-Host "Bytes read: $($ms.Length)"
} catch { Write-Host "ERROR A: $_" }

Write-Host "--- Test B: cast to IRandomAccessStream then AsStream ---"
try {
    $asRAS = [Windows.Storage.Streams.IRandomAccessStream]$sourceStream
    Write-Host "Cast to IRandomAccessStream succeeded: $($asRAS.GetType().FullName)"
    $netStream2 = [System.IO.WindowsRuntimeStreamExtensions]::AsStream($asRAS)
    $ms2 = New-Object System.IO.MemoryStream
    $netStream2.CopyTo($ms2)
    Write-Host "Bytes read: $($ms2.Length)"
} catch { Write-Host "ERROR B: $_" }

Write-Host "--- Test C: DataReader via IInputStream cast ---"
try {
    $asInputStream2 = [Windows.Storage.Streams.IInputStream]$sourceStream
    $reader = [Windows.Storage.Streams.DataReader]::new($asInputStream2)
    $asTaskUint = $asTaskGeneric.MakeGenericMethod([uint32])
    $loadTask = $asTaskUint.Invoke($null, @($reader.LoadAsync([uint32](1024*1024))))
    $loadTask.Wait(-1) | Out-Null
    $count = $loadTask.Result
    Write-Host "DataReader loaded: $count bytes"
    if ($count -gt 0) {
        $bytes3 = [byte[]]::new($count)
        $reader.ReadBytes($bytes3)
        Write-Host "Read OK: $($bytes3.Length)"
    }
} catch { Write-Host "ERROR C: $_" }

Write-Host "--- Test D: InMemoryRandomAccessStream copy ---"
try {
    $memStream = [Windows.Storage.Streams.InMemoryRandomAccessStream]::new()
    Write-Host "InMemoryRandomAccessStream created"
    $copyTask = AwaitProgress ([Windows.Storage.Streams.RandomAccessStream]::CopyAsync($sourceStream, $memStream)) ([ulong]) ([ulong])
    Write-Host "Copied bytes: $copyTask"
    $memStream.Seek(0)
    $size = [uint32]$memStream.Size
    Write-Host "memStream.Size: $size"
    if ($size -gt 0) {
        $reader2 = [Windows.Storage.Streams.DataReader]::new($memStream)
        $asTaskUint = $asTaskGeneric.MakeGenericMethod([uint32])
        $lt = $asTaskUint.Invoke($null, @($reader2.LoadAsync($size)))
        $lt.Wait(-1) | Out-Null
        $cnt = $lt.Result
        $bytes4 = [byte[]]::new($cnt)
        $reader2.ReadBytes($bytes4)
        Write-Host "Final bytes from memStream: $($bytes4.Length)"
    }
} catch { Write-Host "ERROR D: $_" }
