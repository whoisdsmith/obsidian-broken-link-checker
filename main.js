var main_default = BrokenLinkChecker;
var SampleModal = class extends import_obsidian.Modal {
  constructor(app) {
    super(app);
  }
  onOpen() {
    let {contentEl} = this;
    contentEl.setText("Woah!");
  }
  onClose() {
    let {contentEl} = this;
    contentEl.empty();
  }
};
var SampleSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    let {containerEl} = this;
    containerEl.empty();
    containerEl.createEl("h2", {text: "Settings for my awesome plugin."});
    new import_obsidian.Setting(containerEl).setName("Setting #1").setDesc("It's a secret").addText((text) => text.setPlaceholder("Enter your secret").setValue("").onChange(async (value) => {
      console.log("Secret: " + value);
      this.plugin.settings.mySetting = value;
      await this.plugin.saveSettings();
    }));
  }
};
const { Plugin } = require('obsidian');

class BrokenLinksChecker extends Plugin {
  async onload() {
    this.addCommand({
      id: 'broken-link-checker',
      name: 'Broken Link Checker',
      callback: () => this.checkForBrokenLinks(),
    });
  }

  async checkForBrokenLinks() {
    const brokenLinks = new Map();
    const files = this.app.vault.getMarkdownFiles();

    for (const file of files) {
      const content = await this.app.vault.read(file);
      const links = this.extractLinks(content);

      for (const link of links) {
        if (!(await this.isLinkValid(link))) {
          if (!brokenLinks.has(file.path)) {
            brokenLinks.set(file.path, []);
          }
          brokenLinks.get(file.path).push(link);
        }
      }
    }

    this.showBrokenLinks(brokenLinks);
  }

  extractLinks(content) {
    const linkRegex = /\[\[([^|\]]+)(?:\|[^|\]]+)?\]\]/g;
    const links = [];
    let match;

    while ((match = linkRegex.exec(content))) {
      links.push(match[1]);
    }

    return links;
  }

  async isLinkValid(link) {
    const file = this.app.metadataCache.getFirstLinkpathDest(link, '');
    return !!file;
  }

  // Replace this method in the existing code
  async showBrokenLinks(brokenLinks) {
  let content = '';

  if (brokenLinks.size === 0) {
    content = 'No broken links found.\n';
  } else {
    content = '# Broken Links Report\n\n';

    for (const [file, links] of brokenLinks.entries()) {
      content += `- [${file}](${encodeURI(file)}):\n  - ${links.map(link => `[${link}](${encodeURI(link)})`).join('\n  - ')}\n`;
    }
  }

  // Create or update the broken links markdown file
  const brokenLinksFile = await this.getOrCreateBrokenLinksFile();
  await this.app.vault.modify(brokenLinksFile, content);

  // Show a notice that the broken links file has been updated
  new Notice('Broken Links Report has been updated.');
}

// Add this new method to the existing code
async getOrCreateBrokenLinksFile() {
  const fileName = 'Broken Links Report.md';
  let brokenLinksFile = this.app.vault.getAbstractFileByPath(fileName);

  if (!brokenLinksFile) {
    brokenLinksFile = await this.app.vault.create(fileName);
  }

  return brokenLinksFile;
}