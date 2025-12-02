#!/bin/bash

# Post-deploy script para inicializar la base de datos en producción

echo "🔍 Verificando si la base de datos necesita inicialización..."

# Verificar si existen recetas en la base de datos
RECIPE_COUNT=$(sqlite3 data/pizza.db "SELECT COUNT(*) FROM recipes WHERE type='pizza';" 2>/dev/null || echo "0")

if [ "$RECIPE_COUNT" -lt 30 ]; then
  echo "📦 Base de datos vacía o incompleta. Ejecutando seed..."
  npm run seed
  echo "✅ Seed completado. $RECIPE_COUNT recetas cargadas."
else
  echo "✅ Base de datos ya tiene $RECIPE_COUNT pizzas. No se necesita seed."
fi

echo "🚀 Aplicación lista para usar."
