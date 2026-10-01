$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$source = 'C:\Users\lucas\Downloads\Material_Produtos_Ozonteck_Organizado_para_Codex.docx'
$zip = [IO.Compression.ZipFile]::OpenRead($source)
try {
    $reader = [IO.StreamReader]::new($zip.GetEntry('word/document.xml').Open())
    [xml]$xml = $reader.ReadToEnd()
    $reader.Dispose()
    $ns = [Xml.XmlNamespaceManager]::new($xml.NameTable)
    $ns.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')
    $paragraphs = @($xml.SelectNodes('//w:body//w:p', $ns) | ForEach-Object {
        ($_.SelectNodes('.//w:t', $ns) | ForEach-Object { $_.InnerText }) -join ''
    } | Where-Object { $_.Trim() })
} finally { $zip.Dispose() }
$records = @()
for ($i = 0; $i -lt $paragraphs.Count; $i++) {
    if ($paragraphs[$i] -notmatch '^\d+\. ') { continue }
    $start = $i
    $end = $i + 1
    while ($end -lt $paragraphs.Count -and $paragraphs[$end] -notmatch '^\d+\. ') { $end++ }
    $block = @($paragraphs[$start..($end - 1)])
    $code = @($block | Where-Object { $_ -match '^C.digo: ' })[0] -replace '^C.digo: ', ''
    $ean = @($block | Where-Object { $_ -match '^C.digo EAN: ' })[0] -replace '^C.digo EAN: ', ''
    $sourceIndex = -1
    for ($j = 0; $j -lt $block.Count; $j++) { if ($block[$j] -match '^TEXTO-FONTE INTEGRAL') { $sourceIndex = $j; break } }
    $body = @()
    if ($sourceIndex -ge 0) {
        for ($j = $sourceIndex + 1; $j -lt $block.Count; $j++) {
            if ($block[$j] -match '^Identifica..o t.cnica do material') { break }
            $body += $block[$j]
        }
    }
    $records += [ordered]@{ title = $block[0]; code = $code; ean = $ean; body = ($body -join "`n`n"); paragraphs = $block }
    $i = $end - 1
}
if ($records.Count -ne 119) { throw "Expected 119 product records; got $($records.Count)" }
$result = [ordered]@{ source = $source; sha256 = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash; records = $records }
$output = Join-Path $PSScriptRoot '..\docs\product-document-source.json'
[IO.File]::WriteAllText($output, ($result | ConvertTo-Json -Depth 12), [Text.UTF8Encoding]::new($false))
Write-Output "Extracted $($records.Count) products; original paragraphs retained."
