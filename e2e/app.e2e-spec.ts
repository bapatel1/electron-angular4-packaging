import { ElectronPackagerDemoPage } from './app.po';

describe('electron-packager-demo App', () => {
  let page: ElectronPackagerDemoPage;

  beforeEach(() => {
    page = new ElectronPackagerDemoPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
