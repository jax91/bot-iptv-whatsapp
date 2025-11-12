/**
 * State Manager - Gerenciador de Estados da Conversa
 * Controla o fluxo conversacional e estados dos usuários
 */

class StateManager {
  constructor() {
    // Armazena estados dos usuários em memória
    // Para produção, considere usar Redis para persistência
    this.userStates = new Map();
    
    // Tempo limite de inatividade (15 minutos)
    this.TIMEOUT_DURATION = 15 * 60 * 1000;
    
    // Timer para limpeza de estados antigos
    this.startCleanupTimer();
  }

  /**
   * Estados possíveis do usuário
   */
  static STATES = {
    INITIAL: 'initial',
    MENU: 'menu',
    VIEWING_PLANS: 'viewing_plans',
    REQUESTING_TEST: 'requesting_test',
    COLLECTING_NAME: 'collecting_name',
    SELECTING_PLAN: 'selecting_plan',
    PAYMENT_INFO: 'payment_info',
    CONFIRMING_PURCHASE: 'confirming_purchase',
    SUPPORT: 'support',
    HUMAN_TRANSFER: 'human_transfer',
    FEEDBACK: 'feedback'
  };

  /**
   * Obtém o estado atual de um usuário
   * @param {string} userId - ID do usuário (número de telefone)
   * @returns {Object} Estado do usuário
   */
  getState(userId) {
    if (!this.userStates.has(userId)) {
      this.setState(userId, StateManager.STATES.INITIAL);
    }

    const userState = this.userStates.get(userId);
    
    // Verifica timeout
    if (this.isStateExpired(userState)) {
      console.log(`⏱️  Sessão expirada para ${userId}`);
      this.resetState(userId);
      return this.userStates.get(userId);
    }

    return userState;
  }

  /**
   * Define o estado de um usuário
   * @param {string} userId - ID do usuário
   * @param {string} state - Novo estado
   * @param {Object} data - Dados adicionais do estado
   */
  setState(userId, state, data = {}) {
    const currentState = this.userStates.get(userId);
    
    const newState = {
      current: state,
      previous: currentState?.current || null,
      data: { ...currentState?.data, ...data },
      lastUpdate: Date.now(),
      messageCount: (currentState?.messageCount || 0) + 1
    };

    this.userStates.set(userId, newState);
    
    console.log(`📝 Estado atualizado [${userId}]: ${state}`);
  }

  /**
   * Atualiza dados do estado sem mudar o estado atual
   * @param {string} userId - ID do usuário
   * @param {Object} data - Dados para atualizar
   */
  updateStateData(userId, data) {
    const currentState = this.getState(userId);
    this.setState(userId, currentState.current, data);
  }

  /**
   * Retorna ao estado anterior
   * @param {string} userId - ID do usuário
   */
  goToPreviousState(userId) {
    const currentState = this.getState(userId);
    if (currentState.previous) {
      this.setState(userId, currentState.previous);
      console.log(`⬅️  Voltando ao estado: ${currentState.previous}`);
    } else {
      this.setState(userId, StateManager.STATES.MENU);
    }
  }

  /**
   * Reseta o estado do usuário
   * @param {string} userId - ID do usuário
   */
  resetState(userId) {
    this.setState(userId, StateManager.STATES.INITIAL, {});
    console.log(`🔄 Estado resetado para ${userId}`);
  }

  /**
   * Verifica se o estado expirou
   * @param {Object} state - Estado do usuário
   * @returns {boolean}
   */
  isStateExpired(state) {
    if (!state || !state.lastUpdate) return true;
    
    const timeSinceUpdate = Date.now() - state.lastUpdate;
    return timeSinceUpdate > this.TIMEOUT_DURATION;
  }

  /**
   * Obtém dados específicos do estado
   * @param {string} userId - ID do usuário
   * @param {string} key - Chave do dado
   * @returns {*} Valor do dado
   */
  getStateData(userId, key) {
    const state = this.getState(userId);
    return state.data?.[key];
  }

  /**
   * Remove um usuário do gerenciador de estados
   * @param {string} userId - ID do usuário
   */
  removeUser(userId) {
    this.userStates.delete(userId);
    console.log(`🗑️  Estado removido: ${userId}`);
  }

  /**
   * Limpa estados expirados periodicamente
   */
  startCleanupTimer() {
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [userId, state] of this.userStates.entries()) {
        if (this.isStateExpired(state)) {
          this.userStates.delete(userId);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.log(`🧹 Limpeza automática: ${cleaned} estados expirados removidos`);
      }
    }, 5 * 60 * 1000); // A cada 5 minutos
  }

  /**
   * Obtém estatísticas dos estados
   * @returns {Object} Estatísticas
   */
  getStats() {
    const states = {};
    let totalMessages = 0;

    for (const [userId, state] of this.userStates.entries()) {
      states[state.current] = (states[state.current] || 0) + 1;
      totalMessages += state.messageCount || 0;
    }

    return {
      totalUsers: this.userStates.size,
      stateDistribution: states,
      totalMessages,
      avgMessagesPerUser: totalMessages / (this.userStates.size || 1)
    };
  }

  /**
   * Verifica se usuário está em atendimento humano
   * @param {string} userId - ID do usuário
   * @returns {boolean}
   */
  isInHumanTransfer(userId) {
    const state = this.getState(userId);
    return state.current === StateManager.STATES.HUMAN_TRANSFER;
  }

  /**
   * Marca tempo da última interação
   * @param {string} userId - ID do usuário
   */
  touchState(userId) {
    const state = this.getState(userId);
    this.userStates.set(userId, {
      ...state,
      lastUpdate: Date.now()
    });
  }
}

module.exports = new StateManager();
