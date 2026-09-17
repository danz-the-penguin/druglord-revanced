# 🕵️ Drug Lord: ReVanced — Cartel Debug Terminal & Cheats Guide

Welcome to the clandestine operator manual for **Drug Lord: ReVanced**. This document provides the complete reference for accessing the **Cartel Debug Terminal**, interacting with the **Cheat Engine memory mirror**, and using all available console commands, hotkeys, drug ID codes, and city ID codes.

---

## 📑 Table of Contents

1. [How to Open the Terminal](#-how-to-open-the-terminal)
2. [Console Cheat Commands Reference](#-console-cheat-commands-reference)
3. [All 25 Contraband Commodity IDs](#-all-25-contraband-commodity-ids)
4. [All 30 Global City IDs](#-all-30-global-city-ids)
5. [Cheat Engine (.CT) & Memory Buffer Offsets](#-cheat-engine-ct--memory-buffer-offsets)
6. [Browser DevTools JavaScript API](#-browser-devtools-javascript-api)
7. [Easter Eggs & Secret Key Combos](#-easter-eggs--secret-key-combos)

---

## 💻 How to Open the Terminal

You can access the terminal in **four different ways** at any time during gameplay:

| Method | Trigger | Description |
| :--- | :--- | :--- |
| **Tilde Hotkey** | **`~`** or **``` ` ```** | Press the tilde or backquote key on your keyboard. |
| **Terminal Shortcut** | **`Ctrl + Shift + D`** | Standard developer debug combo. |
| **Header UI Button** | **`[>_]` Terminal Icon** | Click the terminal button located in the top navigation header bar (top right). |
| **Quick Action Bar** | Top Terminal Bar | Use the quick-action one-click hack buttons (`+$1M Cash`, `+$5M Bank`, `Clear Debt`, `+30 Days`, `God Mode`, `+5000 Capacity`, `Full Heal`) inside the modal. |

Press **`Escape`** or click the **`X`** in the top right to close the terminal.

---

## ⚡ Console Cheat Commands Reference

Type any of the following commands into the terminal prompt (`>`) and press **`Enter`**:

### 💰 Financial & Banking Commands

| Command Syntax | Example | Description |
| :--- | :--- | :--- |
| `cash <amount>` | `cash 2500000` | Sets your liquid cash on hand to an exact amount. |
| `cash +<amount>` | `cash +500000` | Adds the specified amount to your liquid cash. |
| `bank <amount>` | `bank 10000000` | Sets your offshore Swiss bank deposits to an exact amount. |
| `bank +<amount>` | `bank +2000000` | Wires extra funds into your offshore bank account. |
| `debt <amount>` | `debt 0` | Sets your loan shark principal debt to an exact number. |
| `clear_debt` or `cleardebt` | `clear_debt` | Instantly eliminates all active loan shark debt and resets shark harassment. |

### 🩺 Health, Survivability & God Mode

| Command Syntax | Example | Description |
| :--- | :--- | :--- |
| `heal` | `heal` | Restores player health back to **100% HP**. |
| `health <1-100>` | `health 85` | Sets your exact hit points (between 1 and 100). |
| `god` | `god` | Toggles **Cartel God Mode** (invulnerability in combat, 100% flee chance, HP auto-restores to 100). |
| `capacity <amount>` | `capacity 2500` | Grants extra stash carrying capacity units for pocket smuggling. |
| `noscent <count>` | `noscent 10` | Spawns up to 10 cans of DEA K-9 No-Scent masking spray. |

### ✈️ Travel & Market Manipulation

| Command Syntax | Example | Description |
| :--- | :--- | :--- |
| `teleport <city_id>` | `teleport bogota` | Teleports you immediately to any city with zero travel costs and zero customs risk. |
| `rig <drug_id> <price>` | `rig cocaine 65000` | Forcibly fixes the street price of any commodity in the current local market. |
| `vault_give <city_id> <drug_id> <qty>` | `vault_give miami cocaine 500` | Injects units of any contraband directly into any city's safehouse vault. |
| `days <amount>` | `days 90` | Sets the maximum campaign calendar days. |
| `days +<amount>` | `days +30` | Extends your operation timeframe by adding extra calendar days. |

### 📡 Intelligence & Audio Synthesis

| Command Syntax | Example | Description |
| :--- | :--- | :--- |
| `wire` or `intel` | `wire` | Intercepts active informant tips and wiretaps on upcoming market shortages and police crackdowns. |
| `vault` | `vault` | Audits the contents and contraband stored across all 30 city safehouse vaults. |
| `shipments` | `shipments` | Inspects all active international courier shipments in transit with ETAs. |
| `sfx <name>` | `sfx pager` | Plays any retro Web Audio synthesized sound effect (`buy`, `sell`, `travel`, `police`, `gunshot`, `flee`, `pager`, `bribe`, `heal`, `bank`, `vault`, `courier`, `victory`, `defeat`, `demotion`, `click`). |
| `help` | `help` | Displays the in-terminal command cheat sheet. |

---

## 💊 All 25 Contraband Commodity IDs

Use these exact IDs when running `rig <drug_id> <price>` or `vault_give <city_id> <drug_id> <qty>`:

| Drug ID | Display Name | Base Price | Street Range | Chemical Class |
| :--- | :--- | :---: | :---: | :--- |
| `cocaine` | Cocaine | $22,000 | $15,000 – $32,000 | Crystalline Alkaloid (High Margin) |
| `super_soldier_serum` | Compound-Z | $16,500 | $8,000 – $26,000 | Black-Ops Neural Combat Stimulant |
| `heroin` | Heroin | $9,000 | $5,000 – $14,000 | Semi-Synthetic Opioid |
| `carfentanil` | Carfentanil | $4,800 | $2,500 – $8,500 | Ultra-Potent Elephant Tranquilizer |
| `crack` | Crack | $2,400 | $1,200 – $4,200 | Freebase Cocaine Rock |
| `ice` | Ice | $1,800 | $900 – $3,200 | d-Methamphetamine HCl Shards |
| `pcp` | PCP | $1,100 | $500 – $2,200 | Dissociative Anesthetic (Angel Dust) |
| `opium` | Opium | $800 | $400 – $1,800 | Raw Papaver Somniferum Latex |
| `hashish` | Hashish | $750 | $350 – $1,600 | Concentrated Cannabis Resin |
| `krokodil` | Krokodil | $650 | $280 – $1,400 | Desomorphine Synthesis |
| `dmt` | DMT | $580 | $260 – $1,250 | N,N-Dimethyltryptamine |
| `oxycodone` | Oxycodone | $380 | $180 – $850 | Pharmaceutical Opioid |
| `lsd` | LSD | $320 | $140 – $750 | Lysergic Acid Diethylamide Blotter |
| `morphine` | Morphine | $260 | $120 – $600 | Medical Grade Opiate Ampoules |
| `peyote` | Peyote | $220 | $95 – $520 | Mescaline Cactus Buttons |
| `fentanyl` | Fentanyl | $180 | $80 – $420 | High-Hazard Synthetic Opioid |
| `codeine` | Codeine | $160 | $70 – $380 | Pharmaceutical Cough Syrup / Pills |
| `speed` | Speed | $150 | $65 – $340 | Amphetamine Sulphate Powder |
| `tranq` | Tranq | $140 | $60 – $320 | Xylazine Veterinary Adulterant |
| `mda` | MDA | $110 | $50 – $260 | Tenamfetamine ("Sass") |
| `mushrooms` | Mushrooms | $90 | $40 – $210 | Psilocybin Fungi Caps |
| `pot` | Pot | $60 | $25 – $150 | Cannabis Sativa / Indica Flower |
| `special_k` | Special K | $55 | $25 – $140 | Ketamine Hydrochloride Powder |
| `ecstasy` | Ecstacy | $45 | $20 – $110 | MDMA Pressed Party Tablets |
| `kat` | Kat | $12 | $5 – $35 | Cathinone Plant Leaves |

---

## 🌍 All 30 Global City IDs

Use these exact IDs when running `teleport <city_id>` or `vault_give <city_id> ...`:

| City ID | City Name | Country / Territory | Region |
| :--- | :--- | :--- | :--- |
| `new_york` | New York | United States | North America |
| `miami` | Miami | United States | North America |
| `los_angeles` | Los Angeles | United States | North America |
| `detroit` | Detroit | United States | North America |
| `vancouver` | Vancouver | Canada | North America |
| `toronto` | Toronto | Canada | North America |
| `tijuana` | Tijuana | Mexico | Central America |
| `mexico_city` | Mexico City | Mexico | Central America |
| `panama_city` | Panama City | Panama | Central America |
| `bogota` | Bogotá | Colombia | South America (Production Hub) |
| `medellin` | Medellín | Colombia | South America (Production Hub) |
| `rio_de_janeiro`| Rio de Janeiro| Brazil | South America |
| `sao_paulo` | São Paulo | Brazil | South America |
| `london` | London | United Kingdom | Europe |
| `paris` | Paris | France | Europe |
| `amsterdam` | Amsterdam | Netherlands | Europe (Distribution Hub) |
| `berlin` | Berlin | Germany | Europe |
| `frankfurt` | Frankfurt | Germany | Europe (Fintech Hub) |
| `madrid` | Madrid | Spain | Europe |
| `ibiza` | Ibiza | Spain | Europe (Club Market) |
| `zurich` | Zurich | Switzerland | Europe (Offshore Banking) |
| `istanbul` | Istanbul | Turkey | Middle East / Eurasia |
| `dubai` | Dubai | United Arab Emirates | Middle East (Luxury Market) |
| `tokyo` | Tokyo | Japan | Asia (Premium Markup) |
| `bangkok` | Bangkok | Thailand | Southeast Asia |
| `singapore` | Singapore | Singapore | Southeast Asia |
| `hong_kong` | Hong Kong | Hong Kong | East Asia |
| `sydney` | Sydney | Australia | Oceania (Premium Markup) |
| `johannesburg` | Johannesburg | South Africa | Africa |
| `lagos` | Lagos | Nigeria | Africa |

---

## 💾 Cheat Engine (.CT) & Memory Buffer Offsets

*Drug Lord: ReVanced* includes an integrated **Cheat Engine memory mirror** (`memoryMirror`), keeping an active 32-bit linear buffer synchronized with the game state.

### Download .CT File
Inside the Cartel Debug Terminal, click the **"Get .CT File"** button to download the pre-configured `DrugLord2_Fintech.CT` file.

### Static 4-Byte Memory Offset Map
If attaching Cheat Engine or an external memory scanner to the browser tab process:

| Offset | Type | Description | Live Sync Behavior |
| :---: | :---: | :--- | :--- |
| `+0x00` | 4-Byte Int | **Cash on Hand** | Auto-detected & applied to state every 250ms |
| `+0x04` | 4-Byte Int | **Offshore Bank Balance** | Auto-detected & applied to state every 250ms |
| `+0x08` | 4-Byte Int | **Loan Shark Debt** | Set to 0 to automatically clear loan shark status |
| `+0x0C` | 4-Byte Int | **Player Health (HP)** | Clamped between 1 and 100% |
| `+0x10` | 4-Byte Int | **Current Game Day** | Current calendar day |
| `+0x14` | 4-Byte Int | **Max Game Days** | Extends duration of run |
| `+0x18` | 4-Byte Int | **God Mode Flag** | `1` = Enabled (Invulnerable), `0` = Disabled |
| `+0x1C` | 4-Byte Int | **Extra Stash Capacity** | Increases total carrying capacity units |

Any changes made directly to this memory table are automatically reflected in the HUD in real time.

---

## 🛠️ Browser DevTools JavaScript API

If you prefer using the browser console (`F12` or `Cmd + Option + I` -> **Console**), the game exposes a global `window.drugLordCheat` object:

```javascript
// Add $1,000,000 to liquid cash
window.drugLordCheat.addCash(1000000);

// Set offshore Swiss bank deposits to $25,000,000
window.drugLordCheat.addBank(25000000);

// Wipe all loan shark debt
window.drugLordCheat.clearDebt();

// Toggle Cartel God Mode
window.drugLordCheat.godMode();

// Heal to 100% HP
window.drugLordCheat.heal();

// Add 5,000 extra pocket capacity
window.drugLordCheat.setCapacity(5000);

// Teleport instantly to Medellín
window.drugLordCheat.teleport('medellin');

// Rig the street price of Special K to $15,000/unit
window.drugLordCheat.rigMarket('special_k', 15000);

// View live 32-bit memory buffer
console.table(window.drugLordCheat.memoryView());
```

---

## 🕹️ Easter Eggs & Secret Key Combos

### The Konami Code
At any time while playing, enter the classic sequence on your keyboard:
```
↑  ↑  ↓  ↓  ←  →  ←  →  B  A
```
* **Reward**: Grants **+$100,000 Cash**, **+100 Stash Capacity**, and **100% Full Health**.

---

*Enjoy testing, balancing, and exploring the underworld economy of Drug Lord: ReVanced!*
