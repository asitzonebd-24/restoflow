import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Recipe } from '../types';
import { Plus, Trash2, Save, Utensils } from 'lucide-react';

export const RecipeBuilder = () => {
  const { menu, inventory, recipes, addRecipe, updateRecipe, deleteRecipe } = useApp();
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>('');
  const [ingredients, setIngredients] = useState<{ inventoryItemId: string; quantity: number }[]>([]);

  const handleSaveRecipe = async () => {
    if (!selectedMenuItemId) return;
    const existingRecipe = recipes.find(r => r.menuItemId === selectedMenuItemId);
    if (existingRecipe) {
      await updateRecipe(existingRecipe.id, { ingredients });
    } else {
      await addRecipe({
        id: `recipe-${Date.now()}`,
        menuItemId: selectedMenuItemId,
        ingredients
      });
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { inventoryItemId: '', quantity: 0 }]);
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setIngredients(newIngredients);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6 bg-slate-50 h-full overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <Utensils className="text-indigo-500" /> Recipe Builder
      </h1>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 mb-2">Select Menu Item</label>
          <select 
            value={selectedMenuItemId}
            onChange={(e) => {
              setSelectedMenuItemId(e.target.value);
              const recipe = recipes.find(r => r.menuItemId === e.target.value);
              setIngredients(recipe ? recipe.ingredients : []);
            }}
            className="w-full p-2 border border-slate-300 rounded-lg"
          >
            <option value="">Select an item</option>
            {menu.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>
        
        <div className="space-y-4">
          {ingredients.map((ingredient, index) => (
            <div key={index} className="flex gap-4 items-center">
              <select 
                value={ingredient.inventoryItemId}
                onChange={(e) => updateIngredient(index, 'inventoryItemId', e.target.value)}
                className="flex-1 p-2 border border-slate-300 rounded-lg"
              >
                <option value="">Select ingredient</option>
                {inventory.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <input 
                type="number" 
                value={ingredient.quantity}
                onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value))}
                className="w-24 p-2 border border-slate-300 rounded-lg"
                placeholder="Qty"
              />
              <button onClick={() => removeIngredient(index)} className="text-red-500"><Trash2 size={18}/></button>
            </div>
          ))}
        </div>
        <button onClick={addIngredient} className="mt-4 flex items-center gap-2 text-indigo-600 font-bold"><Plus size={18}/> Add Ingredient</button>
        <button onClick={handleSaveRecipe} className="mt-6 flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold"><Save size={18}/> Save Recipe</button>
      </div>
    </div>
  );
};
