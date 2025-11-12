/**
 * Validators - Funções de Validação
 * Validações de entrada e dados do usuário
 */

/**
 * Validações de cliente
 */
const clientValidators = {
  /**
   * Valida nome do cliente
   * @param {string} name - Nome
   * @returns {Object} Resultado da validação
   */
  validateName(name) {
    if (!name || typeof name !== 'string') {
      return {
        valid: false,
        error: 'Nome é obrigatório'
      };
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      return {
        valid: false,
        error: 'Nome muito curto (mínimo 2 caracteres)'
      };
    }

    if (trimmedName.length > 100) {
      return {
        valid: false,
        error: 'Nome muito longo (máximo 100 caracteres)'
      };
    }

    // Verifica se contém pelo menos um caractere alfabético
    if (!/[a-zA-ZÀ-ÿ]/.test(trimmedName)) {
      return {
        valid: false,
        error: 'Nome deve conter letras'
      };
    }

    return {
      valid: true,
      value: trimmedName
    };
  },

  /**
   * Valida telefone
   * @param {string} phone - Telefone
   * @returns {Object} Resultado da validação
   */
  validatePhone(phone) {
    if (!phone || typeof phone !== 'string') {
      return {
        valid: false,
        error: 'Telefone é obrigatório'
      };
    }

    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length < 10 || cleanPhone.length > 13) {
      return {
        valid: false,
        error: 'Telefone inválido (deve ter entre 10 e 13 dígitos)'
      };
    }

    // Verifica se não é sequência repetida
    if (/^(\d)\1+$/.test(cleanPhone)) {
      return {
        valid: false,
        error: 'Telefone inválido'
      };
    }

    return {
      valid: true,
      value: cleanPhone
    };
  },

  /**
   * Valida email
   * @param {string} email - Email
   * @returns {Object} Resultado da validação
   */
  validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return {
        valid: false,
        error: 'Email é obrigatório'
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return {
        valid: false,
        error: 'Email inválido'
      };
    }

    if (email.length > 100) {
      return {
        valid: false,
        error: 'Email muito longo'
      };
    }

    return {
      valid: true,
      value: email.toLowerCase().trim()
    };
  }
};

/**
 * Validações de plano
 */
const planValidators = {
  /**
   * Valida ID de plano
   * @param {number} planId - ID do plano
   * @param {Array} availablePlans - Planos disponíveis
   * @returns {Object} Resultado da validação
   */
  validatePlanId(planId, availablePlans = []) {
    if (!planId) {
      return {
        valid: false,
        error: 'ID do plano é obrigatório'
      };
    }

    const id = parseInt(planId);

    if (isNaN(id)) {
      return {
        valid: false,
        error: 'ID do plano inválido'
      };
    }

    if (availablePlans.length > 0) {
      const plan = availablePlans.find(p => p.id === id);
      
      if (!plan) {
        return {
          valid: false,
          error: 'Plano não encontrado'
        };
      }

      return {
        valid: true,
        value: id,
        plan
      };
    }

    return {
      valid: true,
      value: id
    };
  },

  /**
   * Valida preço
   * @param {number} price - Preço
   * @returns {Object} Resultado da validação
   */
  validatePrice(price) {
    if (price === undefined || price === null) {
      return {
        valid: false,
        error: 'Preço é obrigatório'
      };
    }

    const numPrice = parseFloat(price);

    if (isNaN(numPrice)) {
      return {
        valid: false,
        error: 'Preço inválido'
      };
    }

    if (numPrice < 0) {
      return {
        valid: false,
        error: 'Preço não pode ser negativo'
      };
    }

    if (numPrice > 999999) {
      return {
        valid: false,
        error: 'Preço muito alto'
      };
    }

    return {
      valid: true,
      value: parseFloat(numPrice.toFixed(2))
    };
  }
};

/**
 * Validações de pagamento
 */
const paymentValidators = {
  /**
   * Valida método de pagamento
   * @param {string} method - Método
   * @returns {Object} Resultado da validação
   */
  validatePaymentMethod(method) {
    const validMethods = ['pix', 'boleto', 'cartao', 'credito', 'debito'];

    if (!method || typeof method !== 'string') {
      return {
        valid: false,
        error: 'Método de pagamento é obrigatório'
      };
    }

    const normalizedMethod = method.toLowerCase().trim();

    if (!validMethods.includes(normalizedMethod)) {
      return {
        valid: false,
        error: 'Método de pagamento inválido'
      };
    }

    return {
      valid: true,
      value: normalizedMethod
    };
  },

  /**
   * Valida número de cartão (básico)
   * @param {string} cardNumber - Número do cartão
   * @returns {Object} Resultado da validação
   */
  validateCardNumber(cardNumber) {
    if (!cardNumber) {
      return {
        valid: false,
        error: 'Número do cartão é obrigatório'
      };
    }

    const cleanNumber = cardNumber.replace(/\D/g, '');

    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      return {
        valid: false,
        error: 'Número de cartão inválido'
      };
    }

    return {
      valid: true,
      value: cleanNumber
    };
  },

  /**
   * Valida CVV
   * @param {string} cvv - CVV
   * @returns {Object} Resultado da validação
   */
  validateCVV(cvv) {
    if (!cvv) {
      return {
        valid: false,
        error: 'CVV é obrigatório'
      };
    }

    const cleanCVV = cvv.replace(/\D/g, '');

    if (cleanCVV.length < 3 || cleanCVV.length > 4) {
      return {
        valid: false,
        error: 'CVV inválido'
      };
    }

    return {
      valid: true,
      value: cleanCVV
    };
  }
};

/**
 * Validações de mensagem
 */
const messageValidators = {
  /**
   * Valida entrada de texto
   * @param {string} text - Texto
   * @param {Object} options - Opções de validação
   * @returns {Object} Resultado da validação
   */
  validateTextInput(text, options = {}) {
    const {
      minLength = 1,
      maxLength = 1000,
      required = true,
      allowEmpty = false
    } = options;

    if (!text || typeof text !== 'string') {
      if (required) {
        return {
          valid: false,
          error: 'Texto é obrigatório'
        };
      }
      return { valid: true, value: '' };
    }

    const trimmedText = text.trim();

    if (!allowEmpty && trimmedText.length === 0 && required) {
      return {
        valid: false,
        error: 'Texto não pode estar vazio'
      };
    }

    if (trimmedText.length < minLength) {
      return {
        valid: false,
        error: `Texto muito curto (mínimo ${minLength} caracteres)`
      };
    }

    if (trimmedText.length > maxLength) {
      return {
        valid: false,
        error: `Texto muito longo (máximo ${maxLength} caracteres)`
      };
    }

    return {
      valid: true,
      value: trimmedText
    };
  },

  /**
   * Valida opção de menu
   * @param {string} option - Opção escolhida
   * @param {Array} validOptions - Opções válidas
   * @returns {Object} Resultado da validação
   */
  validateMenuOption(option, validOptions = ['1', '2', '3', '4', '5']) {
    if (!option || typeof option !== 'string') {
      return {
        valid: false,
        error: 'Opção é obrigatória'
      };
    }

    const trimmedOption = option.trim();

    if (!validOptions.includes(trimmedOption)) {
      return {
        valid: false,
        error: `Opção inválida. Escolha entre: ${validOptions.join(', ')}`
      };
    }

    return {
      valid: true,
      value: trimmedOption
    };
  }
};

/**
 * Validações de data
 */
const dateValidators = {
  /**
   * Valida data
   * @param {*} date - Data
   * @returns {Object} Resultado da validação
   */
  validateDate(date) {
    if (!date) {
      return {
        valid: false,
        error: 'Data é obrigatória'
      };
    }

    const dateObj = new Date(date);

    if (isNaN(dateObj.getTime())) {
      return {
        valid: false,
        error: 'Data inválida'
      };
    }

    return {
      valid: true,
      value: dateObj
    };
  },

  /**
   * Valida se data é futura
   * @param {*} date - Data
   * @returns {Object} Resultado da validação
   */
  validateFutureDate(date) {
    const dateValidation = this.validateDate(date);
    
    if (!dateValidation.valid) {
      return dateValidation;
    }

    const now = new Date();
    
    if (dateValidation.value <= now) {
      return {
        valid: false,
        error: 'Data deve ser futura'
      };
    }

    return dateValidation;
  }
};

/**
 * Sanitização de dados
 */
const sanitizers = {
  /**
   * Sanitiza texto removendo caracteres perigosos
   * @param {string} text - Texto
   * @returns {string} Texto sanitizado
   */
  sanitizeText(text) {
    if (!text || typeof text !== 'string') return '';

    return text
      .trim()
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .substring(0, 1000);
  },

  /**
   * Sanitiza número de telefone
   * @param {string} phone - Telefone
   * @returns {string} Telefone sanitizado
   */
  sanitizePhone(phone) {
    if (!phone || typeof phone !== 'string') return '';

    return phone.replace(/\D/g, '');
  },

  /**
   * Sanitiza email
   * @param {string} email - Email
   * @returns {string} Email sanitizado
   */
  sanitizeEmail(email) {
    if (!email || typeof email !== 'string') return '';

    return email.toLowerCase().trim().substring(0, 100);
  }
};

module.exports = {
  clientValidators,
  planValidators,
  paymentValidators,
  messageValidators,
  dateValidators,
  sanitizers
};
