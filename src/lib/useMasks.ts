import { useState } from 'react'

export function useMasks() {
  const formatPhoneNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, '').substring(0, 11)
    if (cleaned.length > 10) {
      return cleaned.replace(/^(\d\d)(\d{5})(\d{4}).*/, '($1) $2-$3')
    }
    if (cleaned.length > 5) {
      return cleaned.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, '($1) $2-$3')
    }
    if (cleaned.length > 2) {
      return cleaned.replace(/^(\d\d)(\d{0,5}).*/, '($1) $2')
    }
    return cleaned ? cleaned.replace(/^(\d*)/, '($1') : ''
  }

  const formatCPF = (value: string): string => {
    const cleaned = value.replace(/\D/g, '').substring(0, 11)
    let cpf = cleaned
    cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2')
    cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2')
    cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    return cpf
  }

  const formatCNPJ = (value: string): string => {
    const cleaned = value.replace(/\D/g, '').substring(0, 14)
    let cnpj = cleaned
    cnpj = cnpj.replace(/^(\d{2})(\d)/, '$1.$2')
    cnpj = cnpj.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    cnpj = cnpj.replace(/\.(\d{3})(\d)/, '.$1/$2')
    cnpj = cnpj.replace(/(\d{4})(\d)/, '-$1')
    return cnpj
  }

  const formatCEP = (value: string): string => {
    return value
      .replace(/\D/g, '')
      .substring(0, 8)
      .replace(/^(\d{5})(\d{3})/, '$1-$2')
  }

  const formatCurrency = (value: string): string => {
    return parseFloat(value.replace(/\D/g, '') || '0')
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  return {
    formatPhoneNumber,
    formatCPF,
    formatCNPJ,
    formatCEP,
    formatCurrency,
  }
}
