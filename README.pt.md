# BC250 Toolkit — Plugin DeckyLoader

> 🌐 [EN](README.md) · [FR](README.fr.md) · [DE](README.de.md) · [ES](README.es.md) · [IT](README.it.md) · [PT](README.pt.md) · [NL](README.nl.md) · [PL](README.pl.md) · [RU](README.ru.md)

Um plugin [DeckyLoader](https://github.com/SteamDeckHomebrew/decky-loader) para o **ASRock BC-250** (AMD Ryzen Embedded V2000 / Cyan Skillfish) com Bazzite ou SteamOS Linux.

Base de dados comunitária de opções de lançamento otimizadas para o BC-250 — aplicáveis com um clique a partir do Quick Access Menu do Steam.

---

## Funcionalidades

### Separador Jogos
- Deteta automaticamente o jogo selecionado na biblioteca Steam
- Apresenta as definições recomendadas para o BC-250 (versão Proton, opções de lançamento, notas)
- **Botão Aplicar** — escreve as opções de lançamento e seleciona o Proton diretamente via backend
- **Auto-apply** (opt-in) — aplica automaticamente as definições ao iniciar um jogo conhecido

### Separador CU (Compute Units)
- Leitura em tempo real do número de CU ativos através dos registos SPI da GPU
- 4 perfis:
  - **24 CU** (BC-250 stock)
  - **32 CU**
  - **36 CU**
  - **40 CU** (completo — todos os WGPs ativos)
- Aplicação em tempo real sem reinício
- Toggle **Guardar no arranque** — instala um serviço systemd que restaura o perfil em cada arranque
- Requer `umr` — **instalação automática com um botão** (`rpm-ostree install --apply-live`, sem reinício)
- Aviso e recomendações de estabilidade integrados

### Separador Sistema
- Temperaturas CPU/GPU em tempo real
- Estado do scx_lavd, perfil tuned, estado do daemon gamemode
- Botão de atualização manual do [bc250-tweaks](https://github.com/Necrosiak/bc250-tweaks)

### Separador Definições
- Toggle de auto-apply
- Atualização da DB a partir do GitHub

---

## Idioma da interface

O plugin deteta automaticamente o idioma do Steam:

**English · Français · Deutsch · Español · Italiano · Português · Nederlands · Polski · Русский**

---

## Instalação

### Via DeckyLoader (recomendado)
> Plugin a aguardar submissão à Decky Plugin Store.

Instalação manual entretanto:

```bash
git clone https://github.com/Necrosiak/bc250-toolkit-decky.git \
  ~/homebrew/plugins/BC250-Toolkit
sudo systemctl restart plugin_loader
```

### Requisitos
- [DeckyLoader](https://github.com/SteamDeckHomebrew/decky-loader) instalado
- Bazzite ou SteamOS no BC-250

---

## Base de dados de jogos

A DB encontra-se em [`games_db.json`](games_db.json) e atualiza-se automaticamente a partir do GitHub.

### Jogos suportados

| Jogo | Proton | Notas |
|---|---|---|
| Crimson Desert | Proton Experimental (bleeding-edge) | Spoof GPU 731F necessário |
| Cyberpunk 2077 | GE-Proton | RT desativado recomendado |
| Elden Ring | GE-Proton | ~60 FPS jogável |
| Red Dead Redemption 2 | GE-Proton | Modo Vulkan obrigatório |
| Control | GE-Proton | RT funciona (RDNA 1.5) |
| Counter-Strike 2 | Proton Experimental | 100+ FPS |
| Rocket League | Proton Experimental | 120+ FPS |
| Devil May Cry 5 | GE-Proton | ~100 FPS Alto |
| Company of Heroes 3 | GE-Proton | VRAM split mín. 4 GB necessário |
| Detroit: Become Human | Proton Experimental | 60 FPS estável |
| The Last of Us Part I | GE-Proton | 60 FPS Médio-Alto |
| Black Myth: Wukong | GE-Proton | Ficheiros do jogo sem modificações |
| Stardew Valley | Proton Experimental | Perfeito |

### Jogos incompatíveis conhecidos
- **Fortnite** / **Valorant** — EAC a nível de kernel, incompatível com Linux
- **FF VII Rebirth** — Verifica o ID da GPU, Cyan Skillfish não reconhecido, sem solução disponível

---

## Contribuir

### Método fácil — Formulário web

Usa o **[formulário de submissão](https://necrosiak.github.io/bc250-toolkit-decky/)** — preenche os dados, clica em Enviar e um issue do GitHub é criado automaticamente. Após aprovação, o jogo é adicionado via PR.

### Método desenvolvedor — PR direta

1. Faz fork deste repositório
2. Edita `games_db.json` seguindo o formato existente
3. Abre um Pull Request

### Formato de uma entrada

```json
"STEAM_APP_ID": {
  "name": "Nome do jogo",
  "proton": "GE-Proton10-34",
  "launch_options": "MANGOHUD=1 MANGOHUD_CONFIG=no_display gamemoderun %command%",
  "notes": "Notas específicas do BC-250",
  "tested_on": "BC-250"
}
```

> O AppID do Steam encontra-se no URL da página do jogo na Steam Store.

---

## Build (programadores)

```bash
pnpm install
pnpm run build

# Instalar localmente
sudo cp dist/index.js ~/homebrew/plugins/BC250-Toolkit/dist/
sudo cp main.py games_db.json package.json ~/homebrew/plugins/BC250-Toolkit/
sudo systemctl restart plugin_loader
```

---

## Ver também

- [bc250-tweaks](https://github.com/Necrosiak/bc250-tweaks) — tweaks completos do sistema + auto-update
- [AMD BC-250 Docs](https://elektricm.github.io/amd-bc250-docs) — wiki da comunidade
- [bc250.info](https://bc250.info)
