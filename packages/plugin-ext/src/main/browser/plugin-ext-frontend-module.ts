/********************************************************************************
 * Copyright (C) 2018 Red Hat, Inc. and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import '../../../src/main/style/status-bar.css';

import { ContainerModule } from 'inversify';
import { FrontendApplicationContribution, FrontendApplication, WidgetFactory, bindViewContribution } from '@theia/core/lib/browser';
import { MaybePromise, CommandContribution, ResourceResolver, bindContributionProvider } from '@theia/core/lib/common';
import { WebSocketConnectionProvider } from '@theia/core/lib/browser/messaging';
import { HostedPluginSupport } from '../../hosted/browser/hosted-plugin';
import { HostedPluginWatcher } from '../../hosted/browser/hosted-plugin-watcher';
import { HostedPluginLogViewer } from '../../hosted/browser/hosted-plugin-log-viewer';
import { HostedPluginManagerClient } from '../../hosted/browser/hosted-plugin-manager-client';
import { PluginApiFrontendContribution } from './plugin-frontend-contribution';
import { HostedPluginServer, hostedServicePath, PluginServer, pluginServerJsonRpcPath } from '../../common/plugin-protocol';
import { ModalNotification } from './dialogs/modal-notification';
import { PluginWidget } from './plugin-ext-widget';
import { PluginFrontendViewContribution } from './plugin-frontend-view-contribution';

import { HostedPluginInformer } from '../../hosted/browser/hosted-plugin-informer';
import { bindHostedPluginPreferences } from '../../hosted/browser/hosted-plugin-preferences';
import { HostedPluginController } from '../../hosted/browser/hosted-plugin-controller';

import '../../../src/main/browser/style/index.css';
import { PluginExtDeployCommandService } from './plugin-ext-deploy-command';
import { TextEditorService, TextEditorServiceImpl } from './text-editor-service';
import { EditorModelService, EditorModelServiceImpl } from './text-editor-model-service';
import { UntitledResourceResolver } from './editor/untitled-resource';
import { MenusContributionPointHandler } from './menus/menus-contribution-handler';
import { PluginContributionHandler } from './plugin-contribution-handler';
import { ViewRegistry } from './view/view-registry';
import { TextContentResourceResolver } from './workspace-main';
import { MainPluginApiProvider } from '../../common/plugin-ext-api-contribution';
import { KeybindingsContributionPointHandler } from './keybindings/keybindings-contribution-handler';

export default new ContainerModule(bind => {
    bindHostedPluginPreferences(bind);

    bind(ModalNotification).toSelf().inSingletonScope();

    bind(HostedPluginSupport).toSelf().inSingletonScope();
    bind(HostedPluginWatcher).toSelf().inSingletonScope();
    bind(HostedPluginLogViewer).toSelf().inSingletonScope();
    bind(HostedPluginManagerClient).toSelf().inSingletonScope();

    bind(FrontendApplicationContribution).to(HostedPluginInformer).inSingletonScope();
    bind(FrontendApplicationContribution).to(HostedPluginController).inSingletonScope();

    bind(PluginApiFrontendContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(PluginApiFrontendContribution);

    bind(TextEditorService).to(TextEditorServiceImpl).inSingletonScope();
    bind(EditorModelService).to(EditorModelServiceImpl).inSingletonScope();

    bind(UntitledResourceResolver).toSelf().inSingletonScope();
    bind(ResourceResolver).toService(UntitledResourceResolver);

    bind(FrontendApplicationContribution).toDynamicValue(ctx => ({
        onStart(app: FrontendApplication): MaybePromise<void> {
            ctx.container.get(HostedPluginSupport).checkAndLoadPlugin(ctx.container);
        }
    }));
    bind(HostedPluginServer).toDynamicValue(ctx => {
        const connection = ctx.container.get(WebSocketConnectionProvider);
        const hostedWatcher = ctx.container.get(HostedPluginWatcher);
        return connection.createProxy<HostedPluginServer>(hostedServicePath, hostedWatcher.getHostedPluginClient());
    }).inSingletonScope();

    bindViewContribution(bind, PluginFrontendViewContribution);

    bind(PluginWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: PluginFrontendViewContribution.PLUGINS_WIDGET_FACTORY_ID,
        createWidget: () => ctx.container.get(PluginWidget)
    }));

    bind(PluginExtDeployCommandService).toSelf().inSingletonScope();
    bind(PluginServer).toDynamicValue(ctx => {
        const provider = ctx.container.get(WebSocketConnectionProvider);
        return provider.createProxy<PluginServer>(pluginServerJsonRpcPath);
    }).inSingletonScope();

    bind(ViewRegistry).toSelf().inSingletonScope();
    bind(MenusContributionPointHandler).toSelf().inSingletonScope();

    bind(KeybindingsContributionPointHandler).toSelf().inSingletonScope();

    bind(PluginContributionHandler).toSelf().inSingletonScope();

    bind(TextContentResourceResolver).toSelf().inSingletonScope();
    bind(ResourceResolver).toService(TextContentResourceResolver);
    bindContributionProvider(bind, MainPluginApiProvider);
});
