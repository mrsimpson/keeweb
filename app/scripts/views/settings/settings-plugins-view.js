const Backbone = require('backbone');
const Locale = require('../../util/locale');
const PluginManager = require('../../plugins/plugin-manager');
const PluginGallery = require('../../plugins/plugin-gallery');
const AppSettingsModel = require('../../models/app-settings-model');
const Comparators = require('../../util/comparators');
const Format = require('../../util/format');

const SettingsPluginsView = Backbone.View.extend({
    template: require('templates/settings/settings-plugins.hbs'),

    events: {
        'click .settings_plugins-install-btn': 'installClick',
        'click .settings_plugins-uninstall-btn': 'uninstallClick',
        'click .settings_plugins-disable-btn': 'disableClick',
        'click .settings_plugins-enable-btn': 'enableClick',
        'click .settings_plugins-update-btn': 'updateClick',
        'click .settings_plugins-use-locale-btn': 'useLocaleClick',
        'click .settings_plugins-use-theme-btn': 'useThemeClick',
        'click .settings__plugins-gallery-plugin-install-btn': 'galleryInstallClick'
    },

    initialize() {
        this.listenTo(PluginManager, 'change', this.render.bind(this));
        this.listenTo(Backbone, 'plugin-gallery-load-complete', this.render.bind(this));
        PluginGallery.loadPlugins();
    },

    render() {
        const lastInstall = PluginManager.get('lastInstall') || {};
        this.renderTemplate({
            plugins: PluginManager.get('plugins').map(plugin => ({
                id: plugin.id,
                manifest: plugin.get('manifest'),
                status: plugin.get('status'),
                installTime: Math.round(plugin.get('installTime')),
                updateError: plugin.get('updateError'),
                updateCheckDate: Format.dtStr(plugin.get('updateCheckDate')),
                installError: plugin.get('installError')
            })).sort(Comparators.stringComparator('id', true)),
            lastInstallUrl: PluginManager.get('installing') || (lastInstall.error ? lastInstall.url : ''),
            lastInstallError: lastInstall.error,
            galleryLoading: PluginGallery.loading,
            galleryLoadError: PluginGallery.loadError,
            gallery: this.getGallery()
        });
        return this;
    },

    getGallery() {
        if (!PluginGallery.gallery) {
            return null;
        }
        return PluginGallery.gallery;
    },

    installClick() {
        const installBtn = this.$el.find('.settings_plugins-install-btn');
        const urlTextBox = this.$el.find('#settings__plugins-install-url');
        const errorBox = this.$el.find('.settings__plugins-install-error');
        errorBox.html('');
        const url = urlTextBox.val().trim();
        if (!url) {
            return;
        }
        urlTextBox.prop('disabled', true);
        installBtn.text(Locale.setPlInstallBtnProgress + '...').prop('disabled', true);
        PluginManager.install(url)
            .then(() => {
                this.installFinished();
                urlTextBox.val('');
            })
            .catch(e => {
                this.installFinished();
                errorBox.text(e.toString());
            });
    },

    installFinished() {
        const installBtn = this.$el.find('.settings_plugins-install-btn');
        const urlTextBox = this.$el.find('#settings__plugins-install-url');
        urlTextBox.prop('disabled', false);
        installBtn.text(Locale.setPlInstallBtn).prop('disabled', false);
    },

    uninstallClick(e) {
        const pluginId = $(e.target).data('plugin');
        PluginManager.uninstall(pluginId);
    },

    disableClick(e) {
        const pluginId = $(e.target).data('plugin');
        PluginManager.disable(pluginId);
    },

    enableClick(e) {
        const pluginId = $(e.target).data('plugin');
        PluginManager.activate(pluginId);
    },

    updateClick(e) {
        const pluginId = $(e.target).data('plugin');
        PluginManager.update(pluginId);
    },

    useLocaleClick(e) {
        const locale = $(e.target).data('locale');
        AppSettingsModel.instance.set('locale', locale);
    },

    useThemeClick(e) {
        const theme = $(e.target).data('theme');
        AppSettingsModel.instance.set('theme', theme);
    },

    galleryInstallClick(e) {
        const pluginId = $(e.target).data('plugin');
        const plugin = PluginGallery.gallery.plugins.find(pl => pl.manifest.name === pluginId);
        PluginManager.install(plugin.url, plugin.manifest);
    }
});

module.exports = SettingsPluginsView;
