Add-Type -AssemblyName System.Runtime.WindowsRuntime

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetGenericArguments().Count -eq 1
})[0]

function Await($WinRtTask, $ResultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $netTask.Wait(-1) | Out-Null
    return $netTask.Result
}

try {
    [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType=WindowsRuntime] | Out-Null

    $manager = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) `
        ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])

    $session = $null
    foreach ($s in $manager.GetSessions()) {
        if ($s.SourceAppUserModelId -match 'Spotify') { $session = $s; break }
    }

    if (-not $session) {
        Write-Output (@{ found = $false } | ConvertTo-Json -Compress)
        exit
    }

    $props = Await ($session.TryGetMediaPropertiesAsync()) `
        ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
    $playback = $session.GetPlaybackInfo()

    $isPlaying = $playback.PlaybackStatus -eq [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionPlaybackStatus]::Playing

    $result = [ordered]@{
        found   = $true
        playing = $isPlaying
        title   = $props.Title
        artist  = $props.Artist
        album   = $props.AlbumTitle
    }

    Write-Output ($result | ConvertTo-Json -Compress -Depth 4)
} catch {
    Write-Output (@{ found = $false; error = "$_" } | ConvertTo-Json -Compress)
}