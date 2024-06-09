import "dotenv/config";
import express, { query } from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import axios from "axios";
import bingTranslateApi from "bing-translate-api";
const { translate } = bingTranslateApi;

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

const cuisine = [
  "African",
  " Asian",
  " American",
  " British",
  " Cajun",
  " Caribbean",
  " Chinese",
  " European",
  " French",
  " German",
  " Greek",
  " Indian",
  " Irish",
  " Italian",
  " Japanese",
  " Jewish",
  " Korean",
  " Latin American",
  " Mediterranean",
  " Mexican",
  " Middle Eastern",
  " Nordic",
  " Southern",
  " Spanish",
  " Thai",
  " Vietnamese",
];
const cuisineBR = [
  "Africano",
  " Asiático",
  " Americano",
  " Britânico",
  " Cajun",
  " Caribenho",
  " Chinês",
  " Europeu",
  " Francês",
  " Alemão",
  " Grego",
  " Indiano",
  " Irlandês",
  " Italiano",
  " Japonês",
  " Judeu",
  " Coreano",
  " Latino-Americano",
  " Mediterrâneo",
  " Mexicano",
  " Oriente Médio",
  " Nórdico",
  " Meridional",
  " Espanhol",
  " Tailandês",
  " Vietnamita",
];

const diet = [
  "Gluten Free",
  "Ketogenic",
  "Vegetarian",
  "Lacto-Vegetarian",
  "Ovo-Vegetarian",
  "Vegan",
  "Pescetarian",
  "Paleo",
  "Primal",
  "Low FODMAP",
  "Whole30",
];
const dietBR = [
  "Sem Glúten",
  "Cetogênico",
  "Vegetariano",
  "Lacto-Vegetariano",
  "Ovo-Vegetariano",
  "Vegan",
  "Pescetariano",
  "Paleo",
  "Primal",
  "Low FODMAP",
  "Whole30",
];

const intolerances = [
  "Dairy",
  " Egg",
  " Gluten",
  " Grain",
  " Peanut",
  " Seafood",
  " Sesame",
  " Shellfish",
  " Soy",
  " Sulfite",
  " Tree Nut",
  " Wheat",
];
const intolerancesBR = [
  "Laticínios",
  " Ovo",
  " Glúten",
  " Grãos",
  " Amendoim",
  " Frutos do Mar",
  " Gergelim",
  " Marisco",
  " Soja",
  " Sulfito",
  " Nozes",
  " Trigo",
];

const type = [
  "main course",
  " side dish",
  " dessert",
  " appetizer",
  " salad",
  " bread",
  " breakfast",
  " soup",
  " beverage",
  " sauce",
  " marinade",
  " fingerfood",
  " snack",
  " drink",
];
const typeBR = [
  "Prato principal",
  " Acompanhamento",
  " Sobremesa",
  " Aperitivo",
  "Salada",
  "Pão",
  "Café da manhã",
  "Sopa",
  " Bebida",
  " Molho",
  " Marinada",
  " Petiscos",
  " Lanche",
  " Bebidas Alcoólicas",
];

const renderInfo = {
  cuisine: cuisine,
  cuisineBR: cuisineBR,
  diet: diet,
  dietBR: dietBR,
  intolerances: intolerances,
  intolerancesBR: intolerancesBR,
  type: type,
  typeBR: typeBR,
  fwRecipes: "fw-bold text-success",
};

app.locals.__dirname = __dirname;
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.render(__dirname + "/views/index.ejs", {
    fwHome: "fw-bold text-success",
  });
});

app.get("/recipes", async (req, res) => {
  try {
    res.render("recipes.ejs", { renderInfo });
  } catch (error) {
    console.error("Failed to make request:", error.message);
    res.render("index.ejs", {
      error: error.message,
    });
  }
});

app.post("/recipes", async (req, res) => {
  try {
    let translatedQuery = req.body.queryRes;

    if (req.body.queryRes) {
      translatedQuery = await traduzir(req.body.queryRes, "en");
    }

    const complexSearchResult = await spoonCall.recipeComplex(
      translatedQuery,
      req.body.cuisineRes,
      req.body.dietRes,
      req.body.intolerancesRes,
      req.body.typeRes
    );

    const resultInfo = await translateAndPush(complexSearchResult);

    res.render("recipes.ejs", {
      names: resultInfo.names,
      photos: resultInfo.photos,
      ids: resultInfo.ids,
      renderInfo,
    });
  } catch (error) {
    console.error(error);
    res.render("recipes.ejs", {
      renderInfo,
      errorMsg: "Não foram encontrados alimentos com essas especificações",
    });
  }
});

app.get("/info/:id", async (req, res) => {
  try {
    const index = req.params.id;

    const resultDish = await spoonCall.recipeInfo(index);

    let translatedTitle;
    try {
      translatedTitle = await traduzir(resultDish.title, "pt");
    } catch (error) {
      translatedTitle = resultDish.title;
    }

    const dish = {
      title: translatedTitle,
      image: resultDish.image,
    };

    const result = await spoonCall.recipeWidget(index);

    const ingredList = await ingredientParser(result);

    const resultStep = await spoonCall.recipeInstructions(index);

    const stepList = await stepParser(resultStep);

    res.render("info.ejs", {
      stepList: stepList,
      ingredList: ingredList,
      dish: dish,
    });
  } catch (error) {
    console.error("Failed to make request:", error.message);
    res.redirect("/recipes");
  }
});

app.listen(port, () => {
  console.log("Running on " + port);
});

async function traduzir(text, lang) {
  const translatedText = await translate(text, null, lang);
  return translatedText.translation;
}

async function checarUnidade(unidade) {
  let singular = unidade <= 1;

  switch (unidade) {
    case "Tbsp":
      return singular ? "Colher de Sopa" : "Colheres de Sopa";

    case "tsps":
    case "tsp":
      return singular ? "Colher de Chá" : "Colheres de Chá";

    case "pinch":
      return singular ? "Pitada" : "Pitadas";

    case "g":
      return "g";

    default:
      try {
        return await traduzir(unidade, "pt");
      } catch (error) {
        return unidade;
      }
  }
}

const spoonCall = {
  recipeComplex: async function (query, cuisine, diet, intolerances, type) {
    const response = await axios.get(
      `https://api.spoonacular.com/recipes/complexSearch?apiKey=${process.env.API_KEY}&query=${query}&cuisine=${cuisine}&diet=${diet}&intolerances=${intolerances}&type=${type}`
    );
    return response.data;
  },

  recipeImage: function (result, index) {
    return `https://spoonacular.com/recipeImages/${result[index].id}-636x393.jpg`;
  },

  recipeInfo: async function (index) {
    const responseDish = await axios.get(
      `https://api.spoonacular.com/recipes/${index}/information?apiKey=${process.env.API_KEY}`
    );
    return responseDish.data;
  },

  recipeWidget: async function (index) {
    const response = await axios.get(
      `https://api.spoonacular.com/recipes/${index}/ingredientWidget.json?apiKey=${process.env.API_KEY}`
    );
    return response.data.ingredients;
  },

  recipeInstructions: async function (index) {
    const responseStep = await axios.get(
      `https://api.spoonacular.com/recipes/${index}/analyzedInstructions?apiKey=${process.env.API_KEY}`
    );
    return responseStep.data;
  },
};

async function translateAndPush(complexSearchResult) {
  const names = [];
  const photos = [];
  const ids = [];

  for (let i = 0; i < complexSearchResult.results.length; i++) {
    let translatedTitle;
    try {
      translatedTitle = await traduzir(
        complexSearchResult.results[i].title,
        "pt"
      );
      names.push(translatedTitle);
    } catch (error) {
      console.error(error);
      names.push(complexSearchResult.results[i].title);
    }

    photos.push(spoonCall.recipeImage(complexSearchResult.results, i));
    ids.push(complexSearchResult.results[i].id);
  }

  return { names, photos, ids };
}

async function ingredientParser(result) {
  const ingredList = [];

  for (var i = 0; i < result.length; i++) {
    let translatedName;
    try {
      translatedName = await traduzir(result[i].name, "pt");
    } catch (error) {
      translatedName = result[i].name;
    }

    let translatedUnit;

    translatedUnit = await checarUnidade(result[i].amount.metric.unit);

    const value = result[i].amount.metric.value.toString();

    const ingred = {
      id: `${translatedName}_${translatedUnit}_${value}`,
      name: translatedName,
      unit: translatedUnit,
      value: value,
    };

    if (!ingredList.find((ing) => ing.id == ingred.id)) {
      ingredList.push(ingred);
    }
  }

  return ingredList;
}

async function stepParser(resultStep) {
  const stepList = [];

  for (var x = 0; x < resultStep.length; x++) {
    for (var y = 0; y < resultStep[x].steps.length; y++) {
      let translatedStep;
      try {
        translatedStep = await traduzir(resultStep[x].steps[y].step, "pt");
      } catch (error) {
        translatedStep = resultStep[x].steps[y].step;
      }

      stepList.push(translatedStep);
    }
  }

  return stepList;
}
