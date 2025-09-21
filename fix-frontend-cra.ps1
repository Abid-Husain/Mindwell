
# Run in PowerShell from the project root where "frontend" exists
Set-Location -Path "frontend"

# 1) Clean old installs
if (Test-Path node_modules) { Remove-Item -Recurse -Force node_modules }
if (Test-Path package-lock.json) { Remove-Item -Force package-lock.json }

# 2) Make sure npm cache is fine
npm cache clean --force | Out-Null

# 3) Install CRA + React 18 (CRA 5 supports React 18, not 19)
npm install react@18.3.1 react-dom@18.3.1 react-scripts@5.0.1

# 4) Install Tailwind 3 + PostCSS toolchain
npm install -D tailwindcss@3.4.14 postcss autoprefixer

# 5) Generate configs only if missing
if (-not (Test-Path "tailwind.config.js")) {
  npx tailwindcss init -p
}

# 6) Start the app
npm start
