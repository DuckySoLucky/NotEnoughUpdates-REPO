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

const POSITIONS = ["A1", "B1", "C1", "A2", "B2", "C2", "A3", "B3", "C3"];

const output: { [key: string]: Recipe[] } = {};
const items = await readdir("../items");

for (const item of items) {
  const itemData = await Bun.file(`../items/${item}`).json();

  const recipes = [] as Recipe[];
  if (itemData.recipe) {
    recipes.push({
      ...itemData.recipe,
      count: itemData.recipe.count ?? 1,
    });
  }

  const craftingRecipes = itemData.recipes?.filter((recipe: { type: string; }) => recipe?.type === "crafting") ?? [];

  if (craftingRecipes.length) {
    for (const recipe of craftingRecipes) {
      const newRecipe = Object.fromEntries(
        POSITIONS.map((pos, i) => [pos, recipe[pos] ?? ""])
      );

      recipes.push({
        ...newRecipe,
        count: recipe.count,
      } as Recipe);
    }
  }

  if (!recipes.length) {
    continue;
  }

  output[itemData.internalname] = recipes;
}

const sorted = Object.keys(output)
  .sort()
  .reduce<{ [key: string]: Recipe[] }>((acc, key) => {
    acc[key] = output[key];
    return acc;
  }, {});

await Bun.write("../recipes/recipes.json", JSON.stringify(sorted, null, 2));