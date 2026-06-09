#!/bin/bash

URL="http://localhost:5173/api/v1/agendamentos"

nomes=(
  "Igor" "Maria" "João" "Ana" "Carlos" "Fernanda" "Lucas" "Juliana"
  "Pedro" "Camila" "Rafael" "Beatriz" "Bruno" "Larissa" "Felipe"
  "Amanda" "Diego" "Patricia" "Thiago" "Vanessa" "Gustavo" "Marina"
  "Ricardo" "Aline" "Matheus" "Renata" "Eduardo" "Tatiane" "Gabriel"
  "Paula" "Leonardo" "Natália" "Rodrigo" "Carla" "André" "Priscila"
  "Vinicius" "Bianca" "Henrique" "Luana" "Daniel" "Jéssica" "Caio"
  "Débora" "Samuel" "Michele" "Arthur" "Sabrina" "Enzo" "Brenda"
)

servicos=(
  "6a2790ada1c73eb5678c7452"
  "6a2790ada1c73eb5678c7453"
  "6a2790ada1c73eb5678c7454"
  "6a2790ada1c73eb5678c7455"
)

horarios=(
  "08:00" "09:00" "10:00" "11:00"
  "13:00" "14:00" "15:00" "16:00"
)

for i in {1..50}; do
  nome=${nomes[$RANDOM % ${#nomes[@]}]}
  email=$(echo "$nome" | tr '[:upper:]' '[:lower:]')"$i@gmail.com"
  dia=$((18 + RANDOM % 10))
  data="2026-06-$dia"
  horario=${horarios[$RANDOM % ${#horarios[@]}]}
  servico_id=${servicos[$RANDOM % ${#servicos[@]}]}

  json=$(cat <<EOF
{
  "agendamento": {
    "nome": "$nome",
    "email": "$email",
    "data": "$data",
    "horario": "$horario",
    "servico_id": "$servico_id",
    "status": "PENDENTE"
  }
}
EOF
)

  echo "Enviando agendamento $i..."

  curl -s -X POST "$URL" \
    -H "Content-Type: application/json" \
    -d "$json"

  echo ""
done
