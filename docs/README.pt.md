# BC250 Toolkit — Plugin DeckyLoader

> 🌐 [EN](../README.md) · [FR](README.fr.md) · [DE](README.de.md) · [ES](README.es.md) · [IT](README.it.md) · [PT](README.pt.md) · [NL](README.nl.md) · [PL](README.pl.md) · [RU](README.ru.md)

Um plugin [DeckyLoader](https://github.com/SteamDeckHomebrew/decky-loader) para o **ASRock BC-250** (AMD Ryzen Embedded V2000 / Cyan Skillfish) com Bazzite, SteamOS Linux ou CachyOS.

Base de dados comunitária de opções de lançamento otimizadas para o BC-250 — aplicáveis com um clique a partir do Quick Access Menu do Steam.

---

## 📸 Capturas de ecrã

<p align="center">
  <img src="../assets/screenshots/toolkit-games.jpg" width="49%" alt="Games tab"/>
  <img src="../assets/screenshots/toolkit-cu.jpg" width="49%" alt="CU/UMA tab"/>
</p>
<p align="center">
  <img src="../assets/screenshots/toolkit-uma.jpg" width="49%" alt="UMA frame buffer"/>
  <img src="../assets/screenshots/toolkit-system.jpg" width="49%" alt="System tab"/>
</p>

## Funcionalidades

### Separador Jogos
- Deteta automaticamente o jogo selecionado na biblioteca Steam
- Apresenta as definições recomendadas para o BC-250 (versão Proton, opções de lançamento, notas, requisitos de hardware)
- **Variantes de configuração** — quando um jogo oferece vários perfis otimizados (ex. *Stable* vs *Performance*), escolhe-se um num seletor; a escolha é memorizada
- **Botão Aplicar** — numa única ação escreve as opções de lançamento, seleciona o build Proton/GE-Proton e aplica os overrides de GPU por jogo (opções RADV em `~/.drirc`)
- **Auto-apply** (opt-in) — aplica automaticamente a configuração completa ao iniciar um jogo conhecido; ao ativá-lo também pré-configura todos os jogos instalados presentes na base de dados

### Separador CU/UMA (Compute Units e VRAM)
- Leitura em tempo real do número de CU ativos através dos registos SPI da GPU
- 4 perfis:
  - **24 CU** (BC-250 stock)
  - **32 CU**
  - **36 CU**
  - **40 CU** (completo — todos os WGPs ativos)
- Aplicação em tempo real sem reinício
- Toggle **Guardar no arranque** — instala um serviço systemd que restaura o perfil em cada arranque
- Requer `umr` — **instalação automática com um botão** (`rpm-ostree` no Bazzite/SteamOS, `pacman` no CachyOS/Arch)
- Aviso e recomendações de estabilidade integrados
- **Gestão de VRAM (UMA)** — define o *UMA Frame Buffer Size* do BIOS (**Auto / 2G / 4G / 8G**) diretamente do painel, corrigindo a variável NVRAM EFI (`AmdSetup`) — sem passar pelo ecrã do BIOS. Tem efeito no **próximo reinício**; o painel mostra a VRAM ao vivo e o valor pendente no BIOS
  - Salvaguardas: whitelist de versões de BIOS (P3.00), verificação do layout NVRAM, cópia de segurança automática antes de cada escrita (botões desativados em BIOS desconhecidos)
  - Escrever no BIOS requer um [bc250-tweaks](https://github.com/Necrosiak/bc250-tweaks) atualizado (fornece o helper root `bc250-uma-helper` — sem palavra-passe sudo)
  - **Auto (≈8 GB) é o valor seguro recomendado** — se aparecerem artefactos gráficos (p. ex. verdes) após uma alteração, volte para Auto

### Separador Sistema
- Temperaturas CPU/GPU em tempo real, velocidade da ventoinha e clocks GPU/CPU
- **Recursos** — RAM do sistema ativada (o que resta ao SO após a reserva UMA), RAM usada com percentagem e número de CUs ativos
- Estado do scx_lavd, perfil tuned, estado do daemon gamemode
- Botão de atualização manual do [bc250-tweaks](https://github.com/Necrosiak/bc250-tweaks)

### Separador Definições
- Toggle de auto-apply
- Atualização da DB a partir do GitHub
- Sobre — versão do plugin, autor e link do GitHub

---

## Idioma da interface

O plugin deteta automaticamente o idioma do Steam:

**English · Français · Deutsch · Español · Italiano · Português · Nederlands · Polski · Русский**

---

## Instalação

### Via DeckyLoader (recomendado)
1. Ative o **modo de programador** nas definições gerais do Decky
2. Definições do Decky → **Programador** → *Instalar plugin a partir de URL*:
   `https://github.com/Necrosiak/bc250-toolkit-decky/releases/latest/download/BC250-Toolkit.zip`

> Distribuição direta via GitHub: o URL acima aponta sempre para a release mais recente e, depois, o plugin mantém-se atualizado com o auto-update integrado.

Instalação manual entretanto:

```bash
git clone https://github.com/Necrosiak/bc250-toolkit-decky.git \
  ~/homebrew/plugins/BC250-Toolkit
sudo systemctl restart plugin_loader
```

### Requisitos
- [DeckyLoader](https://github.com/SteamDeckHomebrew/decky-loader) instalado
- Bazzite, SteamOS ou CachyOS no BC-250

---

## Base de dados de jogos

A DB encontra-se em [`games_db.json`](../games_db.json) e atualiza-se automaticamente a partir do GitHub.

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
| Code Vein 2 | GE-Proton | UE5 DX12 — requer UMA Frame Buffer = Auto (~8G) + fix unified-heap por jogo (auto-aplicado, ver preset abaixo) |
| Stardew Valley | Proton Experimental | Perfeito |

### Jogos incompatíveis conhecidos
- **Fortnite** / **Valorant** — EAC a nível de kernel, incompatível com Linux
- **FF VII Rebirth** — Verifica o ID da GPU, Cyan Skillfish não reconhecido, sem solução disponível

---

## Contribuir

🐛 **Bugs e ideias: abram issues!** Cada relato orienta diretamente a próxima
release. Bastam algumas linhas — idealmente com o seu OS (Bazzite, CachyOS…),
a versão do plugin, a aba do QAM envolvida e, se possível, os logs
(`~/homebrew/logs/BC250-Toolkit/`, `journalctl -u plugin_loader`). Pedidos de
funcionalidades e «funciona no X» são igualmente bem-vindos.

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

Campos avançados opcionais (o plugin aplica-os automaticamente ao clicar em **Aplicar**):

- **`compat_tool`** — build Proton/GE-Proton a selecionar via o compat mapping do Steam
- **`radv`** — overrides Mesa RADV por jogo escritos em `~/.drirc`, match pelo nome do executável, ex. `{"match": "Game-Win64-Shipping.exe", "options": {"radv_enable_unified_heap_on_apu": false}}`
- **`requires`** — requisitos de hardware mostrados ao utilizador (`uma_min_mb`, `gttsize`)
- **`configs`** — array de variantes alternativas, cada uma com o seu `label`, `stability`, `compat_tool`, `launch_options`, `radv`, `requires`; o utilizador escolhe uma no separador Jogos

> O AppID do Steam encontra-se no URL da página do jogo na Steam Store.

### Preset reutilizável — UE5 DX12 «out of video memory»

Alguns jogos Unreal Engine 5 em DX12 fazem crash na inicialização do render (`D3D12Util.cpp:926 — Out of video memory`) **mesmo com bastante VRAM livre**, porque o unified heap do RADV em APU esconde a VRAM dedicada do VKD3D (`DedicatedVideoMemory ≈ 0`). `games_db.json` inclui um perfil reutilizável **`ue5_dx12_oom`** em `_meta.presets`: desativar o unified heap para o executável do jogo + colocar o **UMA Frame Buffer** do BIOS em **Auto** (já dá ~8 GB num BC-250 de 16 GB — não é preciso forçar 4G) + usar GE-Proton para os codecs de vídeo. Para corrigir um novo jogo afetado, copia o preset para a sua entrada e define `radv.match` para o seu executável. Validado primeiro no **Code Vein 2**.

---

## Build (programadores)

```bash
pnpm install
pnpm run build

# Instalar localmente
sudo cp dist/index.js ~/homebrew/plugins/BC250-Toolkit/dist/
sudo cp main.py updater.py bios_uma.py games_db.json package.json ~/homebrew/plugins/BC250-Toolkit/
sudo systemctl restart plugin_loader
```

---

## Ver também

- [bc250-tweaks](https://github.com/Necrosiak/bc250-tweaks) — tweaks completos do sistema + auto-update
- [AMD BC-250 Docs](https://elektricm.github.io/amd-bc250-docs) — wiki da comunidade
- [bc250.info](https://bc250.info)

---

## Contribuidores da comunidade

- [@AyeZeeBB](https://github.com/AyeZeeBB) — suporte CachyOS/Arch para a instalação do umr + fallback de instância GPU (integrado do fork dele)

---

## 🐧 Compatibilidade

Trabalhamos ativamente para que este plugin funcione em **todos os sistemas operativos documentados para a BC-250** ([documentação da comunidade](https://elektricm.github.io/amd-bc250-docs)) — Bazzite, SteamOS, CachyOS/Arch, Fedora… — com **deteção automática do SO** (gestor de pacotes, instância GPU) para aplicar o método certo na sua distribuição.
