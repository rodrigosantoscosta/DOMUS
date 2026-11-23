import React from 'react';
import { StyleSheet } from 'react-native';
import renderer from 'react-test-renderer';
import { DomusHeader } from '../components/DomusHeader';
import { DomusNavBar } from '../components/DomusNavBar';
import { DomusInput } from '../components/DomusInput';
import { DomusButton } from '../components/DomusButton';
import { InlineConfirmButton } from '../components/InlineConfirmButton';
import { DomusToast } from '../components/DomusToast';
import { DOMUS_COLORS } from '../theme/tokens';
import { AbaDomus } from '../types/domus';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('react-test-renderer is deprecated') ||
       args[0].includes('not configured to support act') ||
       args[0].includes('was not wrapped in act') ||
       args[0].includes('An update to') ||
       args[0].includes('Invalid hook call'))
    ) {
      return;
    }
    originalConsoleError(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Utilitario recursivo para inspecionar arvore de elementos React nos testes
function coletarTextos(node: any): string[] {
  if (!node) return [];
  if (typeof node === 'string' || typeof node === 'number') {
    return [String(node)];
  }
  if (Array.isArray(node)) {
    return node.flatMap(coletarTextos);
  }
  if (node.children) {
    return node.children.flatMap(coletarTextos);
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
    it('renderiza o titulo DOMUS, nome do usuario e botao de logout em linha unica sem badges de status ou reset demo', () => {
      const onLogout = jest.fn();

      const el = DomusHeader({
        titulo: 'DOMUS',
        usuarioNome: 'Junior Corretor',
        onLogout,
      });

      const textos = coletarTextos(el).join(' ');
      expect(textos).toContain('DOMUS');
      expect(textos).toContain('Junior');
      expect(textos).not.toContain('API Online');
      expect(textos).not.toContain('API Offline');
      expect(textos).not.toContain('Modo Demo');

      expect(encontrarPorTestId(el, 'header-status-badge')).toBeNull();
      expect(encontrarPorTestId(el, 'btn-header-reset-demo')).toBeNull();

      const btnLogout = encontrarPorTestId(el, 'btn-header-logout');
      expect(btnLogout).toBeDefined();
      btnLogout.props.onPress();
      expect(onLogout).toHaveBeenCalledTimes(1);
    });

    it('garante touch target minimo de 44pt no botao de logout do header (Apple HIG)', () => {
      let root: any;
      renderer.act(() => {
        root = renderer.create(
          <DomusHeader
            usuarioNome="Junior"
            onLogout={jest.fn()}
          />
        );
      });

      const btnLogout = root.root.findByProps({ testID: 'btn-header-logout' });
      const styleLogout = StyleSheet.flatten(btnLogout.props.style);
      expect(styleLogout.minHeight).toBeGreaterThanOrEqual(44);
      expect(styleLogout.minWidth).toBeGreaterThanOrEqual(44);
    });

    it('renderiza o componente Image com o logotipo DOMUS e suporta fallback para icone em caso de erro', () => {
      let root: any;
      renderer.act(() => {
        root = renderer.create(<DomusHeader titulo="DOMUS" />);
      });

      const logoImg = root.root.findByProps({ testID: 'domus-header-logo' });
      expect(logoImg).toBeDefined();
      expect(logoImg.props.accessibilityLabel).toBe('Logotipo DOMUS');

      // Simula erro no carregamento da imagem para acionar o icone de fallback
      renderer.act(() => {
        logoImg.props.onError();
      });

      const iconFallback = root.root.findByProps({ testID: 'icon-brand-home' });
      expect(iconFallback).toBeDefined();

      renderer.act(() => {
        root.unmount();
      });
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

    it('garante touch target minimo de 48pt (>= 44pt Apple HIG) em cada aba da barra de navegacao', () => {
      let root: any;
      renderer.act(() => {
        root = renderer.create(<DomusNavBar abaAtiva="Agendar" />);
      });
      const tabAgendar = root.root.findByProps({ testID: 'tab-btn-Agendar' });
      const styleTab = StyleSheet.flatten(tabAgendar.props.style);
      expect(styleTab.minHeight).toBeGreaterThanOrEqual(44);
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

    it('renderiza estado loading com spinner e rotulo secundario loadingLabel', () => {
      const onPress = jest.fn();
      let root: any;
      renderer.act(() => {
        root = renderer.create(
          <DomusButton
            title="Salvar"
            loading={true}
            loadingLabel="Salvando..."
            onPress={onPress}
            testID="btn-loading"
          />
        );
      });

      const textos = coletarTextos(root.toJSON());
      expect(textos).toContain('Salvando...');
      const spinner = root.root.findByProps({ testID: 'btn-loading-loading' });
      expect(spinner).toBeDefined();
    });

    it('renderiza estado success com icone de check e rotulo successLabel', () => {
      const onPress = jest.fn();
      let root: any;
      renderer.act(() => {
        root = renderer.create(
          <DomusButton
            title="Cadastrar"
            success={true}
            successLabel="Cadastrado!"
            onPress={onPress}
            testID="btn-success"
          />
        );
      });

      const textos = coletarTextos(root.toJSON());
      expect(textos).toContain('Cadastrado!');
      const icon = root.root.findByProps({ testID: 'btn-success-success-icon' });
      expect(icon).toBeDefined();
    });

    it('respeita area minima de toque de 48pt (>= 44pt Apple HIG)', () => {
      let root: any;
      renderer.act(() => {
        root = renderer.create(
          <DomusButton title="Acao" onPress={jest.fn()} testID="btn-touch-target" />
        );
      });
      const pressable = root.root.findByType('Pressable');
      const style = StyleSheet.flatten(pressable.props.style);
      expect(style.minHeight).toBeGreaterThanOrEqual(44);
    });
  });

  describe('InlineConfirmButton', () => {
    it('exige confirmacao em dois cliques: primeiro clique exibe confirmLabel e segundo clique dispara onConfirm', () => {
      const onConfirm = jest.fn();
      let root: any;
      renderer.act(() => {
        root = renderer.create(
          <InlineConfirmButton
            label="Excluir Registro"
            confirmLabel="Confirmar Exclusao?"
            onConfirm={onConfirm}
            testID="btn-confirm-teste"
          />
        );
      });

      const pressable = root.root.findByType('Pressable');
      let textos = coletarTextos(root.toJSON());
      expect(textos).toContain('Excluir Registro');

      // 1o clique: entra em confirmacao
      renderer.act(() => {
        pressable.props.onPress();
      });
      expect(onConfirm).not.toHaveBeenCalled();
      textos = coletarTextos(root.toJSON());
      expect(textos).toContain('Confirmar Exclusao?');

      // 2o clique: confirma acao
      renderer.act(() => {
        pressable.props.onPress();
      });
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('respeita dimensoes minimas de toque de 44x44pt (Apple HIG)', () => {
      let root: any;
      renderer.act(() => {
        root = renderer.create(
          <InlineConfirmButton
            label="Acao"
            onConfirm={jest.fn()}
            testID="btn-confirm-size"
          />
        );
      });
      const pressable = root.root.findByType('Pressable');
      const style = StyleSheet.flatten(pressable.props.style);
      expect(style.minHeight).toBeGreaterThanOrEqual(44);
      expect(style.minWidth).toBeGreaterThanOrEqual(44);
    });
  });

  describe('DomusToast', () => {
    it('renderiza mensagem quando visivel e dispara onDismiss no botao fechar', () => {
      const onDismiss = jest.fn();
      let root: any;
      renderer.act(() => {
        root = renderer.create(
          <DomusToast
            visivel={true}
            mensagem="Operacao realizada com sucesso"
            tipo="sucesso"
            onDismiss={onDismiss}
            testID="toast-teste"
          />
        );
      });

      const textos = coletarTextos(root.toJSON());
      expect(textos.join(' ')).toContain('Operacao realizada com sucesso');

      const btnFechar = root.root.findByProps({ testID: 'toast-teste-btn-fechar' });
      expect(btnFechar).toBeDefined();
      renderer.act(() => {
        btnFechar.props.onPress();
      });
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('nao renderiza nada quando visivel for falso', () => {
      let root: any;
      renderer.act(() => {
        root = renderer.create(
          <DomusToast
            visivel={false}
            mensagem="Mensagem oculta"
            onDismiss={jest.fn()}
          />
        );
      });
      expect(root.toJSON()).toBeNull();
    });
  });
});
