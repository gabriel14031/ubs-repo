$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$sqlFile = Join-Path $PSScriptRoot 'dados-teste-tts.sql'
$containerSqlPath = '/tmp/ubs-dados-teste-tts.sql'

if (-not (Test-Path (Join-Path $repoRoot 'compose.yaml'))) {
    throw 'Não encontrei compose.yaml na raiz do projeto.'
}

if (-not (Test-Path $sqlFile)) {
    throw "Não encontrei o arquivo SQL: $sqlFile"
}

Push-Location $repoRoot
try {
    $mysqlContainer = docker compose ps --status running -q mysql_server
    if ($LASTEXITCODE -ne 0) {
        throw 'Não foi possível consultar os serviços Docker Compose.'
    }
    if (-not $mysqlContainer) {
        throw 'O MySQL não está em execução. Inicie a stack com "docker compose up -d" e tente novamente.'
    }

    $mysqlReady = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        docker compose exec -T mysql_server sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqladmin --user=root ping --silent' *> $null
        if ($LASTEXITCODE -eq 0) {
            $mysqlReady = $true
            break
        }
        Start-Sleep -Seconds 2
    }
    if (-not $mysqlReady) {
        throw 'O MySQL não ficou pronto após 60 segundos.'
    }

    docker compose cp $sqlFile "mysql_server:$containerSqlPath"
    if ($LASTEXITCODE -ne 0) {
        throw 'Falha ao copiar os dados de teste para o contêiner MySQL.'
    }

    try {
        docker compose exec -T mysql_server sh -c "MYSQL_PWD=`"`$MYSQL_ROOT_PASSWORD`" mysql --default-character-set=utf8mb4 --user=root ubs < $containerSqlPath"
        if ($LASTEXITCODE -ne 0) {
            throw 'O MySQL não conseguiu cadastrar os dados de teste.'
        }
    }
    finally {
        docker compose exec -T mysql_server rm -f $containerSqlPath
    }
}
finally {
    Pop-Location
}
