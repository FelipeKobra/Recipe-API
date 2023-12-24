import express, { query } from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import axios from "axios";
import jQuery from "jquery";
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

app.locals.__dirname = __dirname;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.render(__dirname + "/views/index.ejs", {
    fwHome: "fw-bold text-success",
  });
});

app.get("/recipes", async (req, res) => {
  try {
    res.render("recipes.ejs", {
      cuisine: cuisine,
      cuisineBR: cuisineBR,
      diet: diet,
      dietBR: dietBR,
      intolerances: intolerances,
      intolerancesBR: intolerancesBR,
      type: type,
      typeBR: typeBR,
      fwRecipes: "fw-bold text-success",
    });
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
      const translatedText = await translate(req.body.queryRes, null, "en");
      translatedQuery = translatedText.translation;
    }

    const complexSearchResponse = await axios.get(
      `https://api.spoonacular.com/recipes/complexSearch?apiKey=726d686f92dd401d83de88ca56e86763&query=${translatedQuery}&cuisine=${req.body.cuisineRes}&diet=${req.body.dietRes}&intolerances=${req.body.intolerancesRes}&type=${req.body.typeRes}`
    );

    const complexSearchResult = complexSearchResponse.data;
      console.log(complexSearchResult)
    const names = [];
    const photos = [];
    const ids = [];

    for (let i = 0; i < complexSearchResult.results.length; i++) {
      let translatedTitle;
      try {
        translatedTitle = await translate(
          complexSearchResult.results[i].title,
          null,
          "pt"
        );
        names.push(translatedTitle.translation);
      } catch (error) {
        console.error(error);
        names.push(complexSearchResult.results[i].title);
      }
      
      photos.push(
        `https://spoonacular.com/recipeImages/${complexSearchResult.results[i].id}-636x393.jpg`
      );
      ids.push(complexSearchResult.results[i].id);
    }

    res.render("recipes.ejs", {
      names: names,
      photos: photos,
      ids: ids,
      cuisine: cuisine,
      cuisineBR: cuisineBR,
      diet: diet,
      dietBR: dietBR,
      intolerances: intolerances,
      intolerancesBR: intolerancesBR,
      type: type,
      typeBR: typeBR,
      fwRecipes: "fw-bold text-success",
    });
  } catch (error) {
    console.error(error);
    res.render("recipes.ejs", {
      cuisine: cuisine,
      cuisineBR: cuisineBR,
      diet: diet,
      dietBR: dietBR,
      intolerances: intolerances,
      intolerancesBR: intolerancesBR,
      type: type,
      typeBR: typeBR,
      fwRecipes: "fw-bold text-success",
      errorMsg: "Não foram encontrados alimentos com essas especificações",
    });
  }
});

app.get("/info/:id", async (req, res) => {
  try {
    const index = req.params.id;

    const responseDish = await axios.get(
      `https://api.spoonacular.com/recipes/${index}/information?apiKey=726d686f92dd401d83de88ca56e86763`
    );
    const resultDish = responseDish.data;

    let translatedTitle;
    try {
      const toBeTranslatedTitle = await translate(resultDish.title, null, "pt");
      translatedTitle = toBeTranslatedTitle.translation;
    } catch (error) {
      translatedTitle = resultDish.title;
    }

    const dish = {
      title: translatedTitle,
      image: resultDish.image,
    };



    const response = await axios.get(
      `https://api.spoonacular.com/recipes/${index}/ingredientWidget.json?apiKey=726d686f92dd401d83de88ca56e86763`
    );
    const result = response.data.ingredients;
    console.log(result);

    const ingredList = [];

    for (var i = 0; i < result.length; i++) {
      let translatedName;
      try {
        const toBeTranslatedName = await translate(result[i].name, null, "pt");
        translatedName = toBeTranslatedName.translation;
      } catch (error) {
        translatedName = result[i].name;
      }
      let translatedUnit;
      let singular = result[i].amount.metric.value <= 1;

      switch (result[i].amount.metric.unit) {
        case "Tbsp":
          translatedUnit = singular ? "Colher de Sopa" : "Colheres de Sopa";
          break;

        case "tsps":
        case "tsp":
          translatedUnit = singular ? "Colher de Chá" : "Colheres de Chá";
          break;

        case "pinch":
          translatedUnit = singular ? "Pitada" : "Pitadas";
          break;

        case "g":
          translatedUnit = "g";
          break;

        default:
          try {
            const toBeTranslatedUnit = translate(
              result[i].amount.metric.unit,
              null,
              "pt"
            );
            translatedUnit = toBeTranslatedUnit.translation;
          } catch (error) {
            translatedUnit = result[i].amount.metric.unit;
          }
          break;
      }

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

    const responseStep = await axios.get(
      `https://api.spoonacular.com/recipes/${index}/analyzedInstructions?apiKey=726d686f92dd401d83de88ca56e86763`
    );
    const resultStep = responseStep.data;
    console.log(resultStep);

    const stepList = [];

    for (var x = 0; x < resultStep.length; x++) {
      for (var y = 0; y < resultStep[x].steps.length; y++) {
        let translatedStep;
        try {
          const toBeTranslatedStep = await translate(
            resultStep[x].steps[y].step,
            null,
            "pt"
          );
          translatedStep = toBeTranslatedStep.translation;
        } catch (error) {
          translatedStep = resultStep[x].steps[y].step;
        }

        stepList.push(translatedStep);
      }
    }

    res.render("info.ejs", {
      stepList: stepList,
      ingredList: ingredList,
      dish: dish,
    });
  } catch (error) {
    console.error("Failed to make request:", error.message);
    res.redirect("/recipes")
  }
});

app.listen(port, () => {
  console.log("Running on " + port);
});
