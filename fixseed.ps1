(Get-Content prisma/seed.mjs) | ForEach-Object { $_ -replace "operating_hours: \[\]", "operating_hours: JSON.stringify([])" } | Set-Content prisma/seed.mjs
