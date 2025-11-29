package io.github.galvanized_pukeko.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "pukeko.ui")
public class UiConfigProperties {

  private String baseUrl = "http://localhost:8080";
  private String wsUrl = "ws://localhost:8080/ws";
  private String appName = "pukeko-ui-agent";
  private String pageTitle = "Galvanized Pukeko";

  private UiConfigItem logo;
  private List<UiConfigItem> header;
  private List<UiConfigItem> footer;

  public String getBaseUrl() {
    return baseUrl;
  }

  public void setBaseUrl(String baseUrl) {
    this.baseUrl = baseUrl;
  }

  public String getWsUrl() {
    return wsUrl;
  }

  public void setWsUrl(String wsUrl) {
    this.wsUrl = wsUrl;
  }

  public String getAppName() {
    return appName;
  }

  public void setAppName(String appName) {
    this.appName = appName;
  }

  public String getPageTitle() {
    return pageTitle;
  }

  public void setPageTitle(String pageTitle) {
    this.pageTitle = pageTitle;
  }

  public UiConfigItem getLogo() {
    return logo;
  }

  public void setLogo(UiConfigItem logo) {
    this.logo = logo;
  }

  public List<UiConfigItem> getHeader() {
    return header;
  }

  public void setHeader(List<UiConfigItem> header) {
    this.header = header;
  }

  public List<UiConfigItem> getFooter() {
    return footer;
  }

  public void setFooter(List<UiConfigItem> footer) {
    this.footer = footer;
  }

  @Override
  public String toString() {
    return "UiConfigProperties{" +
        "baseUrl='" + baseUrl + '\'' +
        ", wsUrl='" + wsUrl + '\'' +
        ", appName='" + appName + '\'' +
        ", pageTitle='" + pageTitle + '\'' +
        ", logo=" + logo +
        ", header=" + header +
        ", footer=" + footer +
        '}';
  }

  public static class UiConfigItem {
    private String text;
    private String href;
    private String img;

    public String getText() {
      return text;
    }

    public void setText(String text) {
      this.text = text;
    }

    public String getHref() {
      return href;
    }

    public void setHref(String href) {
      this.href = href;
    }

    public String getImg() {
      return img;
    }

    public void setImg(String img) {
      this.img = img;
    }

    @Override
    public String toString() {
      return "UiConfigItem{" +
          "text='" + text + '\'' +
          ", href='" + href + '\'' +
          ", img='" + img + '\'' +
          '}';
    }
  }
}
