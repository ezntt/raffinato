// src/lib/constants.ts

// 🍋 Regras da Receita (Matemática Ajustada)
export const RECEITA = {
    // Porcentagens: 29,17% Álcool e 70,83% Xarope
    RAZAO_ALCOOL: 29.17 / 100,      
    RAZAO_XAROPE: 70.83 / 100,      

    // Limoncello
    // 1kg Açúcar (0.65L) + 2.25L Água = 2.90L Volume Final
    FATOR_XAROPE_LIMONCELLO: 2.90, 
    AGUA_POR_G_ACUCAR_LIMONCELLO: 2.25,

    // Arancello
    // 1kg Açúcar (0.65L) + 2.50L Água = 3.15L Volume Final
    // (Ajustado para 3.15 para compensar corretamente a diferença de água)
    FATOR_XAROPE_ARANCELLO: 3.15,
    AGUA_POR_G_ACUCAR_ARANCELLO: 2.50,
}

// 📦 Nomes Exatos dos Insumos
export const NOME_INSUMO = {
    GARRAFA_750: 'Garrafa Vidro 750ml',
    GARRAFA_375: 'Garrafa Vidro 375ml',
    TAMPA: 'Tampa',
    LACRE: 'Lacre',
    ROTULO_LIMONCELLO_750: 'Rótulo Limoncello 750ml',
    ROTULO_LIMONCELLO_375: 'Rótulo Limoncello 375ml',
    ROTULO_ARANCELLO_750: 'Rótulo Arancello 750ml',
    ROTULO_ARANCELLO_375: 'Rótulo Arancello 375ml',
    ALCOOL: 'Álcool de Cereal',
    ACUCAR: 'Açúcar Refinado',
    BASE_LIMONCELLO: 'Base Alcoólica Limoncello',
    BASE_ARANCELLO: 'Base Alcoólica Arancello',
}

// 💰 Valores Padrão
export const PRECO_PADRAO = {
    GARRAFA_750: 180.00,
    GARRAFA_375: 100.00
}