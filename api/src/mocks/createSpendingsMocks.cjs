const axios = require("axios");
const dayjs = require("dayjs");

const API_BASE_URL = "http://localhost:6100";
const email = "abc@abc.com";
const password = "azerty";

const randomLabels = [
  "carrefour", "leclerc", "monoprix", "intermarche", "franprix",
  "pharmacie", "docteur", "uber eats", "deliveroo", "pain", "cafe", "baguette",
  "bouteille", "kebab", "sushi shop", "bricolage", "castorama", "leroy merlin",
  "essence", "station", "billet", "sncf", "navigo", "amazon", "fnac", "jeux",
  "netflix", "spotify", "disney", "apple", "google", "app", "bouygues", "orange",
  "sfr", "restaurant", "bar", "cinema", "concert", "abonnement", "decathlon",
  "intersport", "zalando", "zara", "ikea", "bhv", "picard", "biocoop",
  "mlf", "jkipithmg", "njawnfsby", "pvh", "anwjbeem", "aeaxqnf", "hsqojaql", "ixua", "xakeszyq", "luorywy", "bhjnylpay", "xsnsw", "iyylykjt", "xxz", "hcec", "gqbw", "vuekgqv", "jlvodo", "yrdru", "iyzclwun", "hqjak", "jczbrgbn", "ussrgomp", "wleuizcbg", "qoscnkkl", "wxalkr", "rgptq", "yyplbdcf", "nwltnnvof", "miqccm", "acqkv", "mlrkpoei", "aqvt", "xmyl", "umv", "vqhieo", "ouvxumzop", "wjr", "mnjhw", "wjdo", "pgfgywmu", "yftpsd", "xgtb", "hamf", "nuqm", "xxr", "eauztqw", "uqlf", "mudrmraz"
];


const getRandomLabel = () => randomLabels[Math.floor(Math.random() * randomLabels.length)];
const getRandomAmount = () => parseFloat((Math.random() * 99.5 + 0.5).toFixed(2));
const getRandomCategory = (cats) => cats[Math.floor(Math.random() * cats.length)];
const delay = (ms) => new Promise(res => setTimeout(res, ms));

(async () => {
  const fromArg = process.argv[2];
  const toArg = process.argv[3];
  if (!fromArg || !toArg || !/^\d{4}-\d{2}-\d{2}$/.test(fromArg) || !/^\d{4}-\d{2}-\d{2}$/.test(toArg)) {
    console.error("⛔ Format attendu : node script.js YYYY-MM-DD YYYY-MM-DD");
    process.exit(1);
  }

  const fromDate = dayjs(fromArg);
  const toDate = dayjs(toArg);
  let currentDate = fromDate;
  let monthlyTotals = {};

  try {
    const loginRes = await axios.post(`${API_BASE_URL}/users`, { email, password });
    console.log("✅ Authentification réussie");
    const { token, user } = loginRes.data;
    const headers = { Authorization: `Bearer ${token}` };
    const userID = user.id;

    const categoriesRes = await axios.get(`${API_BASE_URL}/categories?userID=${userID}`, { headers });
    console.log("✅ Categories récupérées");
    const categories = categoriesRes.data || [];

    while (currentDate.isBefore(toDate) || currentDate.isSame(toDate, "day")) {
      const yearMonth = currentDate.format("YYYY-MM");
      const weekStart = currentDate.startOf("week").add(1, "day").format("YYYY-MM-DD");
      const weekEnd = dayjs(weekStart).add(6, "days").format("YYYY-MM-DD");

      // Dashboard mensuel
      if (!monthlyTotals[yearMonth]) {
        const first = currentDate.startOf("month").format("YYYY-MM-DD");
        const last = currentDate.endOf("month").format("YYYY-MM-DD");
        monthlyTotals[yearMonth] = { amount: 7000, totalSpent: 0 };

        await axios.post(`${API_BASE_URL}/dashboard`, {
          start: first,
          end: last,
          amount: 7000,
          userID
        }, { headers });
      }

      // Dashboard hebdo + plafond
      const weeklyExists = await axios.get(`${API_BASE_URL}/dashboard`, {
        headers,
        params: { userID }
      }).then(res =>
        res.data.find(d => d.dateFrom === weekStart && d.dateTo === weekEnd)
      ).catch(() => null);

      if (!weeklyExists) {
        console.log(`POST /dashboard : ${weekStart} → ${weekEnd}`);
        const createRes = await axios.post(`${API_BASE_URL}/dashboard`, {
          start: weekStart,
          end: weekEnd,
          amount: 7000,
          userID
        }, { headers });

        const dashboardID = createRes.data.insertId ?? createRes.data.ID;
        if (dashboardID) {
          await axios.put(`${API_BASE_URL}/dashboard/${dashboardID}`, {
            amount: null,
            ceiling: 1200
          }, { headers });
        }
      }

      const nbSpendings = Math.floor(Math.random() * 6) + 3;
      for (let i = 0; i < nbSpendings; i++) {
        const cat = getRandomCategory(categories);
        const amount = getRandomAmount();
        const monthInfo = monthlyTotals[yearMonth];
        const limit = monthInfo.amount;
        const allowExceed = Math.random() < 0.05;

        if (monthInfo.totalSpent + amount > limit && !allowExceed) continue;

        const payload = {
          userID,
          date: currentDate.format("YYYY-MM-DD"),
          label: getRandomLabel(),
          amount,
          category: {
            ID: cat.ID ?? null,
            name: cat.name,
            color: cat.color ?? null
          },
          currency: "EUR"
        };

        await axios.post(`${API_BASE_URL}/spendings`, payload, { headers });
        console.log(`✅ ${payload.date} | ${payload.label} | ${payload.amount}€ | ${cat.name}`);
        monthlyTotals[yearMonth].totalSpent += amount;
      }

      currentDate = currentDate.add(1, "day");
      await delay(50);
    }

    console.log("🎉 Mock terminé avec contrôle des plafonds mensuels.");
  } catch (err) {
    console.error("❌ Erreur :", err.response?.data || err.message);
  }
})();
