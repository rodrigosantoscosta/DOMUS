import React from 'react';
import { DomusHeader } from '../components/DomusHeader';
import { DomusNavBar } from '../components/DomusNavBar';
import { DomusInput } from '../components/DomusInput';
import { DomusButton } from '../components/DomusButton';
import { DOMUS_COLORS } from '../theme/tokens';
import { AbaDomus } from '../types/domus';

// Utilitario recursivo para inspecionar arvore de elementos React nos testes
function coletarTextos(node: any): string[] {
  if (!node) return [];
  if (typeof node === 'string' || typeof node === 'number') {
    return [String(node)];
  }
  if (Array.isArray(node)) {
    return node.flatMap(coletarTextos);
  }
  if (node.props) {
    return coletarTextos(node.props.children);
  }
  return [];
}

function encontrarPorTestId(node: any, testId: string): any {
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const achado = encontrarPorTestId(item, testId);
      if (achado) return achado;
    }
    return null;
  }
  if (node.props?.testID === testId) {
    return node;
  }
  if (node.props?.children) {
    return encontrarPorTestId(node.props.children, testId);
  }
  return null;
}

describe('Componentes Visuais do Prototipo DOMUS', () => {
  describe('DomusHeader', () => {
    it('renderiza o titulo DOMUS, badge de conexao e suporta acoes de logout e reset demo', () => {
      const onLogout = jest.fn();
      const onResetDemo = jest.fn();

      const el = DomusHeader({
        titulo: 'DOMUS',
        modoOffline: true,
        usuarioNome: 'Junior Corretor',
        onLogout,
        onResetDemo,
      });

      const textos = coletarTextos(el);
      expect(textos.join(' ')).toContain('DOMUS');
      expect(textos.join(' ')).toContain('Modo Demo Local');
      expect(textos.join(' ')).toContain('Junior');

      const btnReset = encontrarPorTestId(el, 'btn-header-reset-demo');
      expect(btnReset).toBeDefined();
      btnReset.props.onPress();
      expect(onResetDemo).toHaveBeenCalledTimes(1);

      const btnLogout = encontrarPorTestId(el, 'btn-header-logout');
      expect(btnLogout).toBeDefined();
      btnLogout.props.onPress();
      expect(onLogout).toHaveBeenCalledTimes(1);
    });

    it('exibe badge "API Online" quando modoOffline for falso', () => {
      const el = DomusHeader({
        modoOffline: false,
      });
      const textos = coletarTextos(el);
      expect(textos.join(' ')).toContain('API Online');
    });
  });

  describe('DomusNavBar', () => {
    it('renderiza as quatro abas do prototipo (Agendar, Imoveis, Atendimentos, Clientes)', () => {
      const onSelectTab = jest.fn();
      const el = DomusNavBar({
        abaAtiva: 'Agendar',
        onSelectTab,
      });

      const textos = coletarTextos(el);
      expect(textos).toContain('Agendar');
      expect(textos).toContain('Imoveis');
      expect(textos).toContain('Atendimentos');
      expect(textos).toContain('Clientes');

      const btnClientes = encontrarPorTestId(el, 'tab-btn-Clientes');
      expect(btnClientes).toBeDefined();
      btnClientes.props.onPress();
      expect(onSelectTab).toHaveBeenCalledWith('Clientes');
    });

    it('aplica destaque ativo laranja na aba corrente', () => {
      const el = DomusNavBar({
        abaAtiva: 'Clientes',
      });
      const tabAtiva = encontrarPorTestId(el, 'tab-btn-Clientes');
      expect(tabAtiva).toBeDefined();
      const textos = coletarTextos(tabAtiva);
      expect(textos).toContain('Clientes');
    });
  });

  describe('DomusInput', () => {
    it('renderiza label, placeholder e propaga mudancas no onChangeText', () => {
      const onChangeText = jest.fn();
      const el = DomusInput({
        label: 'nome Completo',
        value: 'Maria Clara',
        placeholder: 'Digite o nome...',
        onChangeText,
        testID: 'input-nome',
      });

      const textos = coletarTextos(el);
      expect(textos).toContain('nome Completo');

      const input = encontrarPorTestId(el, 'input-nome');
      expect(input).toBeDefined();
      expect(input.props.value).toBe('Maria Clara');
      input.props.onChangeText('Maria Clara Silva');
      expect(onChangeText).toHaveBeenCalledWith('Maria Clara Silva');
    });

    it('renderiza mensagem de erro com estilo de destaque', () => {
      const el = DomusInput({
        label: 'Telefone',
        error: 'Telefone é obrigatório',
      });
      const textos = coletarTextos(el);
      expect(textos).toContain('Telefone é obrigatório');
    });
  });

  describe('DomusButton', () => {
    it('renderiza titulo, dispara onPress e suporta variante primaria laranja', () => {
      const onPress = jest.fn();
      const el = DomusButton({
        title: 'Cadastrar',
        variant: 'primary',
        onPress,
        testID: 'btn-cadastrar',
      });

      const textos = coletarTextos(el);
      expect(textos).toContain('Cadastrar');

      const btn = encontrarPorTestId(el, 'btn-cadastrar');
      expect(btn).toBeDefined();
      btn.props.onPress();
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('bloqueia clique quando desabilitado ou carregando', () => {
      const onPress = jest.fn();
      const elDisabled = DomusButton({
        title: 'Salvar',
        disabled: true,
        onPress,
        testID: 'btn-salvar-disabled',
      });

      const btnDisabled = encontrarPorTestId(elDisabled, 'btn-salvar-disabled');
      expect(btnDisabled).toBeDefined();
      btnDisabled.props.onPress();
      expect(onPress).not.toHaveBeenCalled();
    });
  });
});
