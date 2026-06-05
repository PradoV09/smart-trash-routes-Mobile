package io.ionic.starter;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    
    // Habilitar mejor respuesta a touch en WebView
    if (this.bridge != null && this.bridge.getWebView() != null) {
      this.bridge.getWebView().getSettings().setDomStorageEnabled(true);
      this.bridge.getWebView().getSettings().setJavaScriptEnabled(true);
      this.bridge.getWebView().getSettings().setLoadWithOverviewMode(true);
      this.bridge.getWebView().getSettings().setUseWideViewPort(true);
      this.bridge.getWebView().getSettings().setSupportZoom(true);
      this.bridge.getWebView().getSettings().setBuiltInZoomControls(true);
      this.bridge.getWebView().getSettings().setDisplayZoomControls(false);
    }
  }
}
