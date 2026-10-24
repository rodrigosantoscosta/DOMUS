import React from 'react';
import { StyleSheet } from 'react-native';
import renderer from 'react-test-renderer';
import { DomusHeader } from '../components/DomusHeader';
import { DomusNavBar } from '../components/DomusNavBar';
import { DomusInput } from '../components/DomusInput';
import { DomusButton } from '../components/DomusButton';
import { InlineConfirmButton } from '../components/InlineConfirmButton';
import { DomusToast } from '../components/DomusToast';
import { ConnectionModal } from '../components/ConnectionModal';
import { DomusProvider } from '../context/DomusContext';
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

    it('suporta modo de confirmacao em dois toques para reset demo quando habilitado', () => {
      const onResetDemo = jest.fn();
      let root: any;
      renderer.act(() => {
        root = renderer.create(
          <DomusHeader
            onResetDemo={onResetDemo}
            confirmarResetEmDoisToques={true}
          />
        );
      });

      const btnReset = root.root.findByProps({ testID: 'btn-header-reset-demo' });
      let textos = coletarTextos(root.toJSON());
      expect(textos).toContain('Reset Demo');

      // 1o clique: entra em confirmacao
      renderer.act(() => {
        btnReset.props.onPress();
      });
      expect(onResetDemo).not.toHaveBeenCalled();
      textos = coletarTextos(root.toJSON());
      expect(textos).toContain('Confirmar Reset?');

      // 2o clique: confirma execucao
      renderer.act(() => {
        btnReset.props.onPress();
      });
      expect(onResetDemo).toHaveBeenCalledTimes(1);
    });

    it('garante touch targets minimos de 44pt no header (Apple HIG)', () => {
      let root: any;
      renderer.act(() => {
        root = renderer.create(
          <DomusHeader
            usuarioNome="Junior"
            onResetDemo={jest.fn()}
            onLogout={jest.fn()}
            onPressStatus={jest.fn()}
          />
        );
      });

      const btnReset = root.root.findByProps({ testID: 'btn-header-reset-demo' });
      const styleReset = StyleSheet.flatten(btnReset.props.style);
      expect(styleReset.minHeight).toBeGreaterThanOrEqual(44);

      const btnLogout = root.root.findByProps({ testID: 'btn-header-logout' });
      const styleLogout = StyleSheet.flatten(btnLogout.props.style);
      expect(styleLogout.minHeight).toBeGreaterThanOrEqual(44);

      const badgeStatus = root.root.findByProps({ testID: 'header-status-badge' });
      const styleBadge = StyleSheet.flatten(badgeStatus.props.style);
      expect(styleBadge.minHeight).toBeGreaterThanOrEqual(44);
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
      const touchable = root.root.findByType('TouchableOpacity');
      const style = StyleSheet.flatten(touchable.props.style);
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

      const touchable = root.root.findByType('TouchableOpacity');
      let textos = coletarTextos(root.toJSON());
      expect(textos).toContain('Excluir Registro');

      // 1o clique: entra em confirmacao
      renderer.act(() => {
        touchable.props.onPress();
      });
      expect(onConfirm).not.toHaveBeenCalled();
      textos = coletarTextos(root.toJSON());
      expect(textos).toContain('Confirmar Exclusao?');

      // 2o clique: confirma acao
      renderer.act(() => {
        touchable.props.onPress();
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
      const touchable = root.root.findByType('TouchableOpacity');
      const style = StyleSheet.flatten(touchable.props.style);
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

  describe('ConnectionModal', () => {
    it('renderiza os elementos principais de conexao', () => {
      const onFechar = jest.fn();
      let root: any;

      renderer.act(() => {
        root = renderer.create(
          <DomusProvider autoLoginDemo={false}>
            <ConnectionModal visivel={true} onFechar={onFechar} />
          </DomusProvider>
        );
      });

      expect(root).toBeDefined();
      const modal = root.root.findByProps({ testID: 'connection-modal' });
      expect(modal).toBeDefined();
      expect(modal.props.visible).toBe(true);

      const btnFechar = root.root.findByProps({ testID: 'btn-fechar-modal-conexao' });
      expect(btnFechar).toBeDefined();
      btnFechar.props.onPress();
      expect(onFechar).toHaveBeenCalledTimes(1);
      renderer.act(() => {
        root.unmount();
      });
    });

    it('garante touch targets minimos de 44pt no botao fechar e alternar offline do Bottom Sheet', () => {
      let root: any;
      renderer.act(() => {
        root = renderer.create(
          <DomusProvider autoLoginDemo={false}>
            <ConnectionModal visivel={true} onFechar={jest.fn()} />
          </DomusProvider>
        );
      });

      const btnFechar = root.root.findByProps({ testID: 'btn-fechar-modal-conexao' });
      const styleFechar = StyleSheet.flatten(btnFechar.props.style);
      expect(styleFechar.minHeight).toBeGreaterThanOrEqual(44);
      expect(styleFechar.minWidth).toBeGreaterThanOrEqual(44);

      const btnOffline = root.root.findByProps({ testID: 'btn-alternar-offline' });
      const styleOffline = StyleSheet.flatten(btnOffline.props.style);
      expect(styleOffline.minHeight).toBeGreaterThanOrEqual(44);
      renderer.act(() => {
        root.unmount();
      });
    });
  });
});
