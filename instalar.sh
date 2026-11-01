#!/data/data/com.termux/files/usr/bin/bash
# =============================================================================
#  🌀 STYLE-v1 — INSTALADOR (Termux)
#  Uso: bash instalar.sh
#  Instala Node, git, ffmpeg e as dependências do bot. Roda uma vez só.
# =============================================================================
cd "$(dirname "$0")" || exit 1

echo "🌀 Preparando a TARDIS... instalando o STYLE-v1."
echo "────────────────────────────────────────────"

# 1) Atualiza o Termux
pkg update -y && pkg upgrade -y

# 2) Programas necessários (Node, git e ffmpeg pra áudio/vídeo)
pkg install -y nodejs-lts git ffmpeg || pkg install -y nodejs git ffmpeg

# 3) Dependências do projeto
echo "📦 Instalando as dependências do bot..."
npm install --allow-git=all || npm install

echo "────────────────────────────────────────────"
if [ -d node_modules ]; then
  echo "✅ Tudo instalado! Agora é só iniciar:"
  echo "   bash iniciar.sh"
else
  echo "⚠️ Algo falhou no npm install. Rode de novo:  npm install"
fi
