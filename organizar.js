const fs = require("fs");
const path = require("path");

// Pasta de destino
const targetDir = path.join(__dirname, "public");

// Arquivos que devem ir para a pasta public
const filesToMove = ["mapa.html", "jgplay.html", "frases.json", "mapa.png"];

function organizarProjeto() {
  console.log("🔄 Iniciando organização do projeto...");

  // 1. Cria a pasta public se ela não existir
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir);
    console.log('📁 Pasta "public" criada com sucesso.');
  }

  // 2. Move cada arquivo para dentro de public
  filesToMove.forEach((file) => {
    const oldPath = path.join(__dirname, file);
    const newPath = path.join(targetDir, file);

    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
      console.log(`🚚 Movido: ${file} -> public/${file}`);
    } else if (fs.existsSync(newPath)) {
      console.log(`✨ O arquivo ${file} já está na pasta public.`);
    } else {
      console.log(
        `⚠️ Alerta: ${file} não foi encontrado na raiz para ser movido.`,
      );
    }
  });

  console.log("✅ Organização concluída!");
}

organizarProjeto();
