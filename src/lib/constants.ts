// Regras da Receita (Matemática)
export const RECEITA = {
    RAZAO_ALCOOL: 1400 / 4800,      // Proporção de Álcool na base
    RAZAO_XAROPE: 3400 / 4800,      // Proporção de Xarope na base
    VOLUME_ACUCAR_POR_KG: 650,      // 1kg de açúcar ocupa 650ml de volume
    AGUA_POR_KG_LIMONCELLO: 2250,   // Ml de água por Kg de açúcar
    AGUA_POR_KG_ARANCELLO: 2500,    // Ml de água por Kg de açúcar
}

// Nomes Exatos dos Insumos (Para bater com o Banco de Dados)
export const NOME_INSUMO = {
    GARRAFA_750: 'Garrafa Vidro 750ml',
    GARRAFA_375: 'Garrafa Vidro 375ml',
    TAMPA: 'Tampa',
    LACRE: 'Lacre',
    ROTULO_LIMONCELLO_750: 'Rótulo Limoncello 750ml',
    ROTULO_LIMONCELLO_375: 'Rótulo Limoncello 375ml',
    ROTULO_ARANCELLO_750: 'Rótulo Arancello 750ml',
    ROTULO_ARANCELLO_375: 'Rótulo Arancello 375ml',
    ALCOOL: 'Álcool de Cereais',
    ACUCAR: 'Açúcar Refinado'
}

// Valores Padrão (Fallback caso o banco falhe)
export const PRECO_PADRAO = {
    GARRAFA_750: 180.00,
    GARRAFA_375: 100.00
}