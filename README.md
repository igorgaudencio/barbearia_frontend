# Barbearia Frontend

Aplicação frontend em React + Vite.

## Rodando com Docker

Pré-requisitos:

- Docker
- Docker Compose
- Backend da aplicação rodando na máquina host na porta `3000`

Para subir a versão de produção, servida pelo Nginx:

```bash
docker compose up --build
```

Acesse:

```text
http://localhost:8080
```

Por padrão, as chamadas para `/api` são encaminhadas para:

```text
http://host.docker.internal:3000
```

Se o backend estiver em outro endereço, altere a variável `BACKEND_URL` no `docker-compose.yml`:

```yaml
environment:
  BACKEND_URL: http://host.docker.internal:3000
```

## Rodando em modo desenvolvimento

Para subir o Vite com hot reload dentro do container:

```bash
docker compose --profile dev up frontend-dev --build
```

Acesse:

```text
http://localhost:5173
```

No modo desenvolvimento, o proxy da API usa `VITE_API_PROXY_TARGET`. Para mudar o backend, ajuste no `docker-compose.yml`:

```yaml
environment:
  VITE_API_PROXY_TARGET: http://host.docker.internal:3000
```

## Comandos locais

Instale as dependências:

```bash
npm ci
```

Rode em desenvolvimento:

```bash
npm run dev
```

Gere o build de produção:

```bash
npm run build
```

Rode o lint:

```bash
npm run lint
```
