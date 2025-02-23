import { readdir } from "node:fs/promises";

type Recipe = {
  A1: string;
  B1: string;
  C1: string;
  A2: string;
  B2: string;
  C2: string;
  A3: string;
  B3: string;
  C3: string;
  count: number;
};

type Position = keyof Omit<Recipe, "count">;

type OutputItem = {
  name: string;
  recipe: Recipe;
  wiki?: string[];
};

const POSITIONS = ["A1", "B1", "C1", "A2", "B2", "C2", "A3", "B3", "C3"];

const formatRecipes = (recipe: string[]) =>
  POSITIONS.reduce((acc, pos, index) => {
    acc[pos as Position] = recipe[index] || "";
    return acc;
  }, {} as Recipe);

const output: Record<string, OutputItem> = {};
const items = await readdir("../items");

for (const item of items) {
  const itemData = await Bun.file(`../items/${item}`).json();
  if (itemData.recipe) {
    output[itemData.internalname] = {
      name: itemData.displayname.replace(/§./g, ""),
      recipe: {
        ...itemData.recipe,
        count: parseInt(itemData.recipe.count ?? 1) ?? 1,
      },
      wiki: itemData.info,
    };
  }

  const foundRecipes = itemData.recipes?.filter(
    (recipe: { type: string; }) => recipe?.type === "npc_shop"
  );
  if (foundRecipes && foundRecipes.length) {
    for (const recipe of foundRecipes) {
      const newRecipe = formatRecipes(recipe.cost);
      const [fileId, amount] = recipe.result.split(":");
      const id = recipe.result.split(";")[0];

      const itemData = await Bun.file(`../items/${fileId}.json`).json();
      output[id] = {
        name: itemData?.displayname.replace(/§./g, ""),
        recipe: { ...newRecipe, count: parseInt(amount ?? 1) ?? 1 },
        wiki: itemData?.info,
      };
    }
  }
}

const sorted = Object.fromEntries(
  Object.entries(output).sort(([a], [b]) => a.localeCompare(b))
);

await Bun.write("../recipes/recipes.json", JSON.stringify(sorted, null, 2));