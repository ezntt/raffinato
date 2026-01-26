export const RECEITA = {
    RAZAO_ALCOOL: 29.17 / 100,      
    RAZAO_XAROPE: 70.83 / 100,      
    FATOR_XAROPE_LIMONCELLO: 2.88, // 2.25 + 0.63 
    AGUA_POR_G_ACUCAR_LIMONCELLO: 2.25,
    FATOR_XAROPE_ARANCELLO: 3.13, // 2.50 + 0.63
    AGUA_POR_G_ACUCAR_ARANCELLO: 2.50,

    XAROPE_KG_ACUCAR_POR_L_SUCO: 1.0, // 1kg de açúcar para cada 1L de suco
    XAROPE_L_AGUA_POR_L_SUCO: 0.3,    // 300ml de água para cada 1L de suco
    VOLUME_POR_KG_ACUCAR: 0.63        // Cada 1kg de açúcar ocupa 0.63L de volume
}

export const NOME_INSUMO = {
    GARRAFA_750: 'Garrafa Vidro 750ml',
    GARRAFA_375: 'Garrafa Vidro 375ml',
    
    GARRAFA_XAROPE_VAZIA: 'Garrafa Xarope', 
    
    TAMPA: 'Tampa',
    LACRE: 'Lacre',
    SELO: 'Selo',
    // adicionar selo premium? TODO

    LIMAO: 'Limão Siciliano',
    LARANJA: 'Laranja',
    
    ROTULO_LIMONCELLO_750: 'Rótulo Limoncello 750ml',
    ROTULO_LIMONCELLO_375: 'Rótulo Limoncello 375ml',
    ROTULO_ARANCELLO_750: 'Rótulo Arancello 750ml',
    ROTULO_ARANCELLO_375: 'Rótulo Arancello 375ml',
    
    ALCOOL: 'Álcool de Cereais', 
    ACUCAR: 'Açúcar Refinado',
    
    // Bases - Etapa 1: Maceração (Com as cascas)
    BASE_LIMONCELLO_CASCA: 'Base Limoncello (Com Casca)',
    BASE_ARANCELLO_CASCA: 'Base Arancello (Com Casca)',

    // Bases - Etapa 2: Filtrada (Pronta para uso no licor)
    BASE_LIMONCELLO_FILTRADA: 'Base Limoncello (Filtrada)', 
    BASE_ARANCELLO_FILTRADA: 'Base Arancello (Filtrada)',
    SACOLA: 'Sacola',
    CAIXA_DE_PAPELAO: 'Caixa de Papelão',
    EMBALAGEM_VELUDO: 'Embalagem Veludo',
}

export const PRECO_PADRAO = {
    GARRAFA_750: 180.00,
    GARRAFA_375: 100.00
}