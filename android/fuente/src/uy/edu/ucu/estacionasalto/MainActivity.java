package uy.edu.ucu.estacionasalto;

import android.app.Activity;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.graphics.Color;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.content.SharedPreferences;
import android.content.Intent;
import android.net.Uri;
import org.json.JSONObject;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URI;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Native Android host. Only bundled assets may use the read-only bridge. */
public final class MainActivity extends Activity {
    private static final String APP_HOST = "appassets.androidplatform.net";
    private static final String APP_URL = "https://" + APP_HOST + "/assets/index.html";
    private static final String USER_AGENT = "EstacionaSalto-PI2/0.1.3 (Android; educational parking project)";
    private static final String PUBLIC_SERVER = "https://oxide-land-psychological-gonna.trycloudflare.com";
    private WebView web;
    private SharedPreferences preferences;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private volatile boolean destroyed = false;
    private volatile long generation = 0;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        preferences = getSharedPreferences("conexion", MODE_PRIVATE);
        if (!preferences.getBoolean("public-default-013", false)) {
            SharedPreferences.Editor editor = preferences.edit().putBoolean("public-default-013", true);
            if (preferences.getString("servidor", "").trim().isEmpty()) {
                editor.putString("servidor", PUBLIC_SERVER).putInt("grupo", 1).putBoolean("demo", false);
            }
            editor.apply();
        }
        getWindow().setStatusBarColor(Color.rgb(244, 247, 248));
        getWindow().setNavigationBarColor(Color.rgb(244, 247, 248));
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(244, 247, 248));
        final FrameLayout safeContainer = new FrameLayout(this);
        safeContainer.setBackgroundColor(Color.rgb(244, 247, 248));
        safeContainer.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
            @Override public WindowInsets onApplyWindowInsets(View view, WindowInsets insets) {
                return applySafeInsets(view, insets);
            }
        });
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setUserAgentString(USER_AGENT);
        web.addJavascriptInterface(new ReadOnlyBridge(), "AppNative");
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equals(uri.getScheme()) && APP_HOST.equals(uri.getHost())) {
                    String path = uri.getPath();
                    if (path == null || !path.startsWith("/assets/") || path.contains("..")) return emptyResponse();
                    String asset = path.substring(8);
                    if (!(asset.equals("index.html") || asset.equals("app.js") || asset.equals("ucu-map.js") || asset.equals("core.js") || asset.equals("style.css") || asset.equals("safe-layout.css"))) return emptyResponse();
                    try {
                        String mime = asset.endsWith(".js") ? "application/javascript" : asset.endsWith(".css") ? "text/css" : "text/html";
                        Map<String, String> headers = new HashMap<String, String>();
                        headers.put("X-Content-Type-Options", "nosniff");
                        return new WebResourceResponse(mime, "UTF-8", 200, "OK", headers, getAssets().open(asset));
                    } catch (Exception ignored) { return emptyResponse(); }
                }
                if ("https".equals(uri.getScheme()) && ("tile.openstreetmap.org".equals(uri.getHost())
                    || ("services.arcgisonline.com".equals(uri.getHost()) && uri.getPath() != null
                        && uri.getPath().startsWith("/ArcGIS/rest/services/World_Imagery/MapServer/tile/")))) return null;
                // No other remote content can be rendered inside the privileged WebView.
                return emptyResponse();
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (APP_URL.equals(uri.toString())) return false;
                if ("https".equals(uri.getScheme()) && ("www.openstreetmap.org".equals(uri.getHost())
                    || "services.arcgisonline.com".equals(uri.getHost()))) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (Exception ignored) {}
                }
                return true;
            }
        });
        safeContainer.addView(web, new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(safeContainer);
        safeContainer.requestApplyInsets();
        web.loadUrl(APP_URL);
    }

    /** Resize the WebView itself, so CSS fixed navigation stays above Android's bars. */
    private WindowInsets applySafeInsets(View container, WindowInsets original) {
        try {
            // Reflection keeps the API-28 build compatible with modern Android 15+ insets.
            // Clear only the types handled by the container; preserve IME notifications.
            Class<?> types = Class.forName("android.view.WindowInsets$Type");
            int mask = ((Integer) types.getMethod("systemBars").invoke(null)).intValue()
                | ((Integer) types.getMethod("displayCutout").invoke(null)).intValue();
            Object safe = WindowInsets.class.getMethod("getInsets", int.class).invoke(original, mask);
            Class<?> insetClass = Class.forName("android.graphics.Insets");
            container.setPadding(insetClass.getField("left").getInt(safe), insetClass.getField("top").getInt(safe),
                insetClass.getField("right").getInt(safe), insetClass.getField("bottom").getInt(safe));
            Class<?> builderClass = Class.forName("android.view.WindowInsets$Builder");
            Object builder = builderClass.getConstructor(WindowInsets.class).newInstance(original);
            builderClass.getMethod("setInsets", int.class, insetClass).invoke(builder, mask, insetClass.getField("NONE").get(null));
            return (WindowInsets) builderClass.getMethod("build").invoke(builder);
        } catch (Exception legacyAndroid) {
            int left = original.getSystemWindowInsetLeft(), top = original.getSystemWindowInsetTop();
            int right = original.getSystemWindowInsetRight(), bottom = original.getSystemWindowInsetBottom();
            WindowInsets adjusted = original;
            if (android.os.Build.VERSION.SDK_INT >= 28 && original.getDisplayCutout() != null) {
                left = Math.max(left, original.getDisplayCutout().getSafeInsetLeft());
                top = Math.max(top, original.getDisplayCutout().getSafeInsetTop());
                right = Math.max(right, original.getDisplayCutout().getSafeInsetRight());
                bottom = Math.max(bottom, original.getDisplayCutout().getSafeInsetBottom());
                adjusted = adjusted.consumeDisplayCutout();
            }
            container.setPadding(left, top, right, bottom);
            return adjusted.replaceSystemWindowInsets(0, 0, 0, 0);
        }
    }

    private WebResourceResponse emptyResponse() {
        return new WebResourceResponse("text/plain", "UTF-8", new ByteArrayInputStream(new byte[0]));
    }

    private JSONObject readConfig() throws Exception {
        return new JSONObject().put("servidor", preferences.getString("servidor", PUBLIC_SERVER))
            .put("grupo", preferences.getInt("grupo", 1)).put("demo", preferences.getBoolean("demo", false));
    }

    public final class ReadOnlyBridge {
        @JavascriptInterface public String getConfig() {
            try { return readConfig().toString(); } catch (Exception ignored) {
                return "{\"servidor\":\"" + PUBLIC_SERVER + "\",\"grupo\":1,\"demo\":false}";
            }
        }

        @JavascriptInterface public String saveConfig(String encoded) {
            try {
                if (encoded == null || encoded.length() > 4096) throw new Exception("Configuración demasiado larga.");
                JSONObject input = new JSONObject(encoded);
                String server = input.optString("servidor", "").trim().replaceAll("/+$", "");
                int group = input.getInt("grupo");
                boolean demo = input.getBoolean("demo");
                if (group < 1 || group > 4) throw new Exception("Equipo inválido.");
                if (!server.isEmpty()) validateServer(server);
                if (!demo && server.isEmpty()) throw new Exception("Ingresá el dominio HTTPS del servidor.");
                generation++;
                preferences.edit().putString("servidor", server).putInt("grupo", group).putBoolean("demo", demo).apply();
                return new JSONObject().put("ok", true).toString();
            } catch (Exception e) {
                try { return new JSONObject().put("ok", false).put("error", e.getMessage()).toString(); }
                catch (Exception ignored) { return "{\"ok\":false}"; }
            }
        }

        @JavascriptInterface public void requestUpdate(final String requestId) {
            if (destroyed || requestId == null || requestId.length() > 64) return;
            final long requestGeneration = generation;
            final String server = preferences.getString("servidor", PUBLIC_SERVER);
            final int group = preferences.getInt("grupo", 1);
            if (preferences.getBoolean("demo", false)) return;
            worker.submit(new Runnable() {
                @Override public void run() {
                    JSONObject result = new JSONObject();
                    try {
                        result.put("request_id", requestId);
                        validateServer(server);
                        JSONObject state = readJson(server + "/api/estado?grupo=" + group);
                        result.put("estado", state).put("ok", true);
                        try { result.put("historial", readJson(server + "/api/historial?grupo=" + group + "&limite=60")); }
                        catch (Exception e) { result.put("historial_error", "No se pudo actualizar el historial."); }
                    } catch (Exception e) {
                        try { result.put("ok", false).put("error", friendlyError(e)); } catch (Exception ignored) {}
                    }
                    final String payload = result.toString().replace("\u2028", "\\u2028").replace("\u2029", "\\u2029");
                    main.post(new Runnable() {
                        @Override public void run() {
                            if (!destroyed && requestGeneration == generation)
                                web.evaluateJavascript("window.receiveNativeResult(" + payload + ");", null);
                        }
                    });
                }
            });
        }
    }

    private static void validateServer(String server) throws Exception {
        URI uri = new URI(server);
        if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null
            || uri.getQuery() != null || uri.getFragment() != null || server.length() > 2048)
            throw new Exception("Usá una dirección HTTPS sin contraseñas ni parámetros.");
    }

    private JSONObject readJson(String endpoint) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(endpoint).openConnection();
        connection.setConnectTimeout(10000);
        connection.setReadTimeout(12000);
        connection.setInstanceFollowRedirects(false);
        connection.setRequestProperty("Accept", "application/json");
        connection.setRequestProperty("User-Agent", USER_AGENT);
        InputStream stream = null;
        try {
            int status = connection.getResponseCode();
            if (status != 200) throw new Exception("HTTP " + status + ". Revisá el dominio y el acceso a la API.");
            stream = connection.getInputStream();
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192]; int n;
            while ((n = stream.read(buffer)) != -1) {
                if (bytes.size() + n > 1048576) throw new Exception("La respuesta del servidor es demasiado grande.");
                bytes.write(buffer, 0, n);
            }
            try { return new JSONObject(bytes.toString("UTF-8")); }
            catch (Exception ignored) { throw new Exception("El dominio no devuelve JSON. Revisá la API y Cloudflare Access."); }
        } finally {
            if (stream != null) try { stream.close(); } catch (Exception ignored) {}
            connection.disconnect();
        }
    }

    private static String friendlyError(Exception e) {
        if (e instanceof java.net.UnknownHostException) return "No se encuentra el servidor. Revisá el dominio y la conexión a Internet.";
        if (e instanceof java.net.SocketTimeoutException) return "El servidor no respondió a tiempo.";
        if (e instanceof javax.net.ssl.SSLException) return "No se pudo verificar la conexión HTTPS del servidor.";
        String message = e.getMessage();
        return message == null || message.length() > 180 ? "No se pudo conectar con el servidor." : message;
    }

    @Override protected void onPause() {
        if (web != null) { web.evaluateJavascript("window.onAppPause&&window.onAppPause();", null); web.onPause(); }
        super.onPause();
    }
    @Override protected void onResume() {
        super.onResume();
        if (web != null) { web.onResume(); web.evaluateJavascript("window.onAppResume&&window.onAppResume();", null); }
    }
    @Override public void onBackPressed() {
        web.evaluateJavascript("window.handleAppBack?window.handleAppBack():false;", new android.webkit.ValueCallback<String>() {
            @Override public void onReceiveValue(String value) { if (!"true".equals(value)) finish(); }
        });
    }
    @Override protected void onDestroy() {
        destroyed = true; generation++; worker.shutdownNow(); main.removeCallbacksAndMessages(null);
        if (web != null) { web.removeJavascriptInterface("AppNative"); web.destroy(); }
        super.onDestroy();
    }
}
