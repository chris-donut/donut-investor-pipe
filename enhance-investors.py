#!/usr/bin/env python3
"""Enhance investor seed data with recent deals, Donut relevance, and key contacts."""
import json

ENHANCEMENTS = {
    "Point72 Ventures": {
        "recent_deals": [
            {"company": "Polymarket", "round": "Series B", "amount": "$45M", "date": "2024-Q2"},
            {"company": "Zerohash", "round": "Series B/C", "amount": "Undisclosed", "date": "2024"},
            {"company": "Syncfy", "round": "Seed", "amount": "$10M", "date": "2024-Q3"},
        ],
        "donut_relevance": "Steve Cohen's quant trading VC. Deep alignment with AI+trading thesis. Polymarket bet shows crypto conviction. Note: sold fintech portfolio Jan 2026, crypto team now primary.",
        "partners": [
            {"name": "Pete Casella", "title": "Partner, Fintech", "twitter": "petecasella", "focus": ["Trading Infrastructure", "Crypto", "Capital Markets"]},
            {"name": "Tara Stokes", "title": "Partner", "focus": ["Early Stage", "Fintech"]},
        ],
    },
    "Two Sigma Ventures": {
        "recent_deals": [
            {"company": "Steadily", "round": "Series C", "amount": "$30M", "date": "2025-Q2"},
            {"company": "Distributional", "round": "Series A", "amount": "$19M", "date": "2024-Q4"},
            {"company": "Metalayer (spinout)", "round": "Fund I", "amount": "$25M crypto fund", "date": "2024-Q4"},
        ],
        "donut_relevance": "From Two Sigma ($60B quant hedge fund). Note: 3 partners spun out to launch Metalayer — dedicated crypto fund. Parent VC still does AI+fintech. Donut fits both.",
        "partners": [
            {"name": "Dan Abelon", "title": "Partner", "twitter": "danabelon", "focus": ["Fintech", "AI", "Data"]},
            {"name": "Frances Schwiep", "title": "Partner", "focus": ["Early Stage", "AI"]},
        ],
    },
    "Coatue Management": {
        "recent_deals": [
            {"company": "Cursor (Anysphere)", "round": "Series D", "amount": "$2.3B at $29.3B val", "date": "2025-Q2"},
            {"company": "Harvey", "round": "Series E", "amount": "$300M at $5B val", "date": "2025-Q1"},
            {"company": "Hut 8", "round": "Strategic", "amount": "$150M convertible", "date": "2024-Q3"},
        ],
        "donut_relevance": "Philippe Laffont Feb 2026: 'the world is moving to the token economy.' Pattern: backs vertical AI apps (Cursor for devs, Harvey for lawyers) = Donut for crypto traders. $50M-300M checks.",
        "partners": [
            {"name": "Philippe Laffont", "title": "Founder & CIO", "twitter": "PhilippeLaffont", "focus": ["AI", "Tech", "Crypto"]},
            {"name": "Rahul Kishore", "title": "Senior MD, Fintech", "focus": ["Fintech", "Public+Private"]},
            {"name": "Thomas Laffont", "title": "Co-Founder, PE", "twitter": "ThomasLaffont", "focus": ["Private Investments", "Crypto"]},
        ],
    },
    "Ribbit Capital": {
        "recent_deals": [
            {"company": "Morpho", "round": "Series B (led)", "amount": "$50M", "date": "2024-Q3"},
            {"company": "Privy", "round": "Series B (led)", "amount": "$15M", "date": "2025-Q1"},
            {"company": "One (OnePay)", "round": "Series D", "amount": "$300M at $2.5B val", "date": "2024-Q4"},
        ],
        "donut_relevance": "Premier fintech+crypto crossover. Led Morpho $50M (DeFi lending), backed Coinbase+Robinhood+Revolut+Nubank. New $500M fund ('Ribbit Y') March 2025 = fresh capital.",
        "partners": [
            {"name": "Micky Malka", "title": "Founder & Managing Partner", "twitter": "malka", "focus": ["Fintech", "Crypto", "Trading"]},
            {"name": "Nick Shalek", "title": "General Partner", "twitter": "nickshalek", "focus": ["Consumer Fintech", "Trading Apps"]},
        ],
    },
    "General Catalyst": {
        "recent_deals": [
            {"company": "Ostium", "round": "Series A (co-led)", "amount": "$20M at $250M val", "date": "2025-Q4"},
            {"company": "Kite AI", "round": "Series A (co-led)", "amount": "$18M", "date": "2025-Q3"},
            {"company": "Fund XII", "round": "Fund", "amount": "$8B raised", "date": "2024-Q4"},
        ],
        "donut_relevance": "Co-led Ostium (on-chain perps for TradFi assets) Dec 2025 — DIRECT comparable to Donut's perps trading. $8B fund with explicit AI+financial services mandate. Kite AI = AI agent payment rails.",
        "partners": [
            {"name": "Hemant Taneja", "title": "CEO & Managing Director", "twitter": "hemant_taneja", "focus": ["AI", "Financial Services"]},
            {"name": "Kyle Doherty", "title": "Managing Director, Crypto", "twitter": "kdoherty_gc", "focus": ["Crypto", "DeFi", "Infrastructure"]},
        ],
    },
    "Radical Ventures": {
        "recent_deals": [
            {"company": "Cohere", "round": "Series D (follow-on)", "amount": "$5.5B val", "date": "2025"},
            {"company": "Spara", "round": "Seed", "amount": "$15M", "date": "2025"},
            {"company": "Fund IV", "round": "Fund", "amount": "$650M early + $800M growth = $1.45B", "date": "2024-2025"},
        ],
        "donut_relevance": "Geoffrey Hinton's fund. $1.45B in fresh capital. Jordan Jacobs co-founded Layer 6 AI (acquired by TD Bank) — AI applied to financial services background. Not a ChatGPT wrapper thesis.",
        "partners": [
            {"name": "Jordan Jacobs", "title": "Co-founder & Managing Partner", "twitter": "jjacobs22", "focus": ["AI", "Deep Learning", "Financial AI"]},
            {"name": "Tomi Poutanen", "title": "Co-founder & Partner", "twitter": "tomi_poutanen", "focus": ["AI", "Enterprise AI"]},
        ],
    },
    "Lux Capital": {
        "recent_deals": [
            {"company": "Erebor", "round": "Series A (led)", "amount": "$350M at $4.35B val", "date": "2025-Q4"},
            {"company": "Physical Intelligence", "round": "Series A", "amount": "$400M", "date": "2024-Q4"},
            {"company": "Fund IX", "round": "Fund", "amount": "$1.5B (largest ever)", "date": "2026-Q1"},
        ],
        "donut_relevance": "Led Erebor $350M (crypto-native national bank) — clearest signal of crypto-TradFi convergence conviction. Grace Isford (youngest partner ever) leads AI investments incl Runway, LangChain.",
        "partners": [
            {"name": "Grace Isford", "title": "Partner", "twitter": "graceisford", "focus": ["AI Infrastructure", "AI Applications", "Dev Tooling"]},
            {"name": "Josh Wolfe", "title": "Co-founder & Managing Partner", "twitter": "wolfejosh", "focus": ["Deep Tech", "Crypto-TradFi", "Frontier"]},
        ],
    },
    "Index Ventures": {
        "recent_deals": [
            {"company": "Bridge (→ Stripe $1.1B acq)", "round": "Series A (co-led)", "amount": "$58M", "date": "2024-Q1"},
            {"company": "Mirelo AI", "round": "Seed (co-led w/ a16z)", "amount": "$41M", "date": "2025"},
            {"company": "New Funds", "round": "Fund", "amount": "$2.3B ($800M venture + $1.5B growth)", "date": "2024-Q3"},
        ],
        "donut_relevance": "Co-led Bridge Series A (stablecoin infra → Stripe acquired for $1.1B). Avoids speculation, backs crypto rails + UX. Pattern: Robinhood + Bridge = next-gen trading/financial infra. $2.3B fresh.",
        "partners": [
            {"name": "Danny Rimer", "title": "Partner", "twitter": "dannyrimer", "focus": ["Fintech", "Marketplaces", "AI"]},
            {"name": "Nina Achadjian", "title": "Partner", "twitter": "nachadjian", "focus": ["Early-stage Fintech", "Vertical SaaS"]},
        ],
    },
    "Y Combinator": {
        "recent_deals": [
            {"company": "YC S25 batch", "round": "Seed", "amount": "$500K standard (now offers USDC on Solana)", "date": "2025"},
            {"company": "Coinbase (historical)", "round": "Seed", "amount": "YC standard", "date": "2012"},
        ],
        "donut_relevance": "Now offers seed investment in USDC on Solana — explicitly signaling Solana-native crypto companies. Garry Tan backed Coinbase seed. Tom Blomfield (Monzo founder) is partner — fintech background.",
        "partners": [
            {"name": "Garry Tan", "title": "CEO & President", "twitter": "garrytan", "focus": ["AI", "Consumer", "Crypto"]},
            {"name": "Tom Blomfield", "title": "Group Partner", "twitter": "t_blom", "focus": ["Fintech", "Neobanking", "Trading"]},
        ],
    },
    "Elad Gil": {
        "recent_deals": [
            {"company": "Eon", "round": "Series D (led)", "amount": "$300M at $4B val", "date": "2025"},
            {"company": "Tako", "round": "Seed", "amount": "$5.75M", "date": "2024-Q4"},
            {"company": "Perplexity, Harvey, Mistral", "round": "Various", "amount": "$250K-$20M range", "date": "2024-2025"},
        ],
        "donut_relevance": "$800M solo GP fund. Forbes Midas #6 2024. Explicitly calls 'financial tooling and fintech' a wide-open AI opportunity. Backed Coinbase seed. His check = instant signal to entire VC ecosystem.",
        "partners": [
            {"name": "Elad Gil", "title": "Solo GP, Gil Ventures", "twitter": "eladgil", "focus": ["AI", "Fintech", "Crypto", "Infrastructure"],
             "linkedin": "eladgil", "email_pattern": "via eladgil.com or Twitter DM"},
        ],
    },
    "Naval Ravikant": {
        "recent_deals": [
            {"company": "Quanta", "round": "Series A", "amount": "Undisclosed", "date": "2025-Q4"},
            {"company": "Tako", "round": "Seed (w/ Elad Gil)", "amount": "$5.75M", "date": "2024-Q4"},
            {"company": "Perplexity", "round": "Follow-on", "amount": "Undisclosed", "date": "2024-2025"},
        ],
        "donut_relevance": "Co-founded MetaStable Capital (crypto hedge fund) + CoinList. 22 crypto investments. Note: called Solana 'gambling platform' 2024 — pitch Donut as the infrastructure making on-chain trading sophisticated, not speculative.",
        "partners": [
            {"name": "Naval Ravikant", "title": "Angel / Chairman AngelList", "twitter": "naval", "focus": ["Crypto", "AI", "Philosophy"],
             "linkedin": "naval-ravikant", "email_pattern": "Twitter DM only. Cold works if exceptionally concise."},
        ],
    },
    "Santiago Santos": {
        "recent_deals": [
            {"company": "Inversion Capital", "round": "Seed fund", "amount": "$26.5M", "date": "2025-Q3"},
            {"company": "Fluent Labs", "round": "Series A", "amount": "Undisclosed", "date": "2025-Q1"},
            {"company": "MegaETH, Blast, NEAR, LayerZero", "round": "Angel", "amount": "Various", "date": "2023-2025"},
        ],
        "donut_relevance": "150+ crypto investments. Ex-ParaFi Capital. Now runs Inversion Capital ($26.5M). Bridges institutional finance and on-chain DeFi. His check opens doors to every DeFi protocol Donut integrates with.",
        "partners": [
            {"name": "Santiago Roel Santos", "title": "Founder & CEO, Inversion Capital", "twitter": "santiagoroel", "focus": ["DeFi", "Web3", "Crypto Infrastructure"],
             "linkedin": "santiago-roel-santos", "email_pattern": "santiago@inversioncap.com. Very active on Twitter."},
        ],
    },
    "Arthur Hayes / Maelstrom": {
        "recent_deals": [
            {"company": "Ethena", "round": "Strategic (co-led)", "amount": "$14M at $300M val", "date": "2024-Q1"},
            {"company": "Infinit", "round": "Seed", "amount": "$6M", "date": "2024"},
            {"company": "Maelstrom PE Fund", "round": "Fund", "amount": "$250M target (first close Mar 2026)", "date": "2025-Q4"},
        ],
        "donut_relevance": "BitMEX founder invented the perpetual swap Donut users trade. $250M PE fund explicitly targeting 'trading infrastructure and analytics startups.' 37.5% portfolio in DeFi. Direct strategic fit.",
        "partners": [
            {"name": "Akshat Vaidya", "title": "Co-Founder & Head of Investments", "twitter": "akshat_vaidya", "focus": ["DeFi", "Trading Infra", "Crypto"],
             "linkedin": "akshat-vaidya", "email_pattern": "info@maelstrom.fund. Primary deal contact."},
            {"name": "Arthur Hayes", "title": "CIO & Founder", "twitter": "CryptoHayes", "focus": ["Crypto Trading", "Macro", "DeFi"],
             "linkedin": "arthurhayes", "email_pattern": "Engage Akshat first. Arthur responds to strong macro-narrative founders."},
        ],
    },
    "6th Man Ventures": {
        "recent_deals": [
            {"company": "375ai", "round": "Series A", "amount": "Undisclosed", "date": "2025-Q4"},
            {"company": "Legion", "round": "Seed", "amount": "Undisclosed", "date": "2024-Q3"},
            {"company": "Kintsu", "round": "Seed", "amount": "Undisclosed", "date": "2024-Q3"},
        ],
        "donut_relevance": "~50% portfolio in Solana ecosystem. Mike Dudas (ex-The Block CEO) is perma-online crypto power-user. Backs 'consumer crypto apps that generate real revenue.' Can open doors to Solana Foundation, Jupiter, every DeFi protocol.",
        "partners": [
            {"name": "Mike Dudas", "title": "General Partner & Co-Founder", "twitter": "mdudas", "focus": ["Crypto", "AI", "Solana", "DeFi"],
             "linkedin": "mdudas", "email_pattern": "mike@6thman.ventures. Best via Twitter DM with trading volume metrics."},
            {"name": "Serge Kassardjian", "title": "Co-Founder & GP", "twitter": "serge_kass", "focus": ["Crypto", "Gaming", "Infrastructure"],
             "linkedin": "serge-kassardjian", "email_pattern": "serge@6thman.ventures"},
        ],
    },
}

# Read existing seed data
with open("data/seed-investors.json") as f:
    investors = json.load(f)

updated = 0
for inv in investors:
    name = inv["name"]
    if name in ENHANCEMENTS:
        enh = ENHANCEMENTS[name]
        inv["recent_deals"] = enh.get("recent_deals", [])
        inv["donut_relevance"] = enh.get("donut_relevance", "")
        inv["partners"] = enh.get("partners", inv.get("partners", []))
        inv["notes"] = enh.get("donut_relevance", inv.get("notes", ""))
        updated += 1
        print(f"  Enhanced: {name} ({len(enh.get('recent_deals', []))} deals, {len(enh.get('partners', []))} contacts)")

with open("data/seed-investors.json", "w") as f:
    json.dump(investors, f, indent=2, ensure_ascii=False)

print(f"\nTotal: {len(investors)} investors, {updated} enhanced with deals + contacts")
