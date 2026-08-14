package com.endocore.app

import android.os.Bundle
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.platform.LocalContext
import android.content.Context
import android.graphics.Bitmap
import android.net.http.SslError
import android.webkit.SslErrorHandler
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                EndoCoreApp()
            }
        }
    }
}

@Composable
fun EndoCoreApp() {
    val context = LocalContext.current
    val sharedPref = remember { context.getSharedPreferences("EndoCorePrefs", Context.MODE_PRIVATE) }

    val cloudUrl = "https://endocore-workspace.onrender.com?platform=mobile"

    // Connection mode: "local" (default for emulator) or "cloud"
    var connectionMode by remember {
        mutableStateOf(sharedPref.getString("connection_mode", "local") ?: "local")
    }
    var localIp by remember { mutableStateOf(sharedPref.getString("ip_address", "10.0.2.2") ?: "10.0.2.2") }
    var localPort by remember { mutableStateOf(sharedPref.getString("port", "5173") ?: "5173") }

    // UI states
    var showSettings by remember { mutableStateOf(false) }
    var hasError by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf("") }
    var webViewRef by remember { mutableStateOf<WebView?>(null) }
    var isPageLoading by remember { mutableStateOf(true) }
    var isLoading by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()

    // Determine target URL based on connection mode
    val targetUrl = if (connectionMode == "local" && localIp.trim().isNotEmpty()) {
        "http://${localIp.trim()}:${localPort.trim()}?platform=mobile"
    } else {
        cloudUrl
    }

    Box(modifier = Modifier.fillMaxSize()) {
        if (showSettings) {
            // ── Settings / Connection Configuration Screen ──
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(0xFF0F0F11))
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFF1E1E24), shape = RoundedCornerShape(16.dp))
                        .border(1.dp, Color(0xFF2E2E38), shape = RoundedCornerShape(16.dp))
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text(
                        text = "🕊️ EndoCore",
                        color = Color.White,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center
                    )

                    Text(
                        text = "CONNECTION SETTINGS",
                        color = Color(0xFFD4AF37),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        letterSpacing = 1.5.sp,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(4.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(1.dp)
                            .background(Color(0xFF2E2E38))
                    )
                    Spacer(modifier = Modifier.height(4.dp))

                    // ── Cloud Connection (Default) ──
                    Button(
                        onClick = {
                            connectionMode = "cloud"
                            sharedPref.edit()
                                .putString("connection_mode", "cloud")
                                .apply()
                            showSettings = false
                            hasError = false
                            isPageLoading = true
                            // Force WebView to reload with cloud URL
                            webViewRef?.loadUrl(cloudUrl)
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (connectionMode == "cloud") Color(0xFFD4AF37) else Color(0xFF2E2E38),
                            contentColor = if (connectionMode == "cloud") Color(0xFF0F0F11) else Color.White
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            "☁️  Use Cloud Server (Default)",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    }

                    Text(
                        text = "Connects to endocore-workspace.onrender.com\nNo setup required. Works on any network.",
                        color = Color(0xFF666666),
                        fontSize = 10.sp,
                        textAlign = TextAlign.Center,
                        lineHeight = 14.sp
                    )

                    Spacer(modifier = Modifier.height(8.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(1.dp)
                            .background(Color(0xFF2E2E38))
                    )

                    Text(
                        text = "OR CONNECT TO LOCAL DEV SERVER",
                        color = Color(0xFFA0A0B0),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )

                    // IP Address input
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = "PC LOCAL IP ADDRESS",
                            color = Color(0xFFA0A0B0),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                        OutlinedTextField(
                            value = localIp,
                            onValueChange = { localIp = it },
                            placeholder = { Text("e.g. 192.168.1.15", color = Color(0xFF666666)) },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White,
                                focusedBorderColor = Color(0xFFD4AF37),
                                unfocusedBorderColor = Color(0xFF2E2E38),
                                focusedContainerColor = Color(0xFF0F0F11),
                                unfocusedContainerColor = Color(0xFF0F0F11)
                            ),
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }

                    // Port Input
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = "EXPRESS SERVER PORT",
                            color = Color(0xFFA0A0B0),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                        OutlinedTextField(
                            value = localPort,
                            onValueChange = { localPort = it },
                            placeholder = { Text("3000", color = Color(0xFF666666)) },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White,
                                focusedBorderColor = Color(0xFFD4AF37),
                                unfocusedBorderColor = Color(0xFF2E2E38),
                                focusedContainerColor = Color(0xFF0F0F11),
                                unfocusedContainerColor = Color(0xFF0F0F11)
                            ),
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }

                    // Connect to local server button
                    Button(
                        onClick = {
                            if (localIp.trim().isEmpty()) {
                                Toast.makeText(context, "Please enter a valid IP address", Toast.LENGTH_SHORT).show()
                                return@Button
                            }
                            connectionMode = "local"
                            sharedPref.edit()
                                .putString("connection_mode", "local")
                                .putString("ip_address", localIp)
                                .putString("port", localPort)
                                .apply()

                            isLoading = true
                            coroutineScope.launch {
                                delay(500)
                                isLoading = false
                                showSettings = false
                                hasError = false
                                isPageLoading = true
                                val localUrl = "http://${localIp.trim()}:${localPort.trim()}?platform=mobile"
                                webViewRef?.loadUrl(localUrl)
                            }
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF2E2E38),
                            contentColor = Color.White
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        shape = RoundedCornerShape(8.dp),
                        enabled = !isLoading
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                color = Color(0xFFD4AF37),
                                modifier = Modifier.size(24.dp)
                            )
                        } else {
                            Text("🖥️  Connect to Local PC", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                    }

                    Text(
                        text = "Ensure your PC and phone are on the same Wi-Fi network and the Express server is running.",
                        color = Color(0xFF666666),
                        fontSize = 11.sp,
                        textAlign = TextAlign.Center,
                        lineHeight = 16.sp
                    )
                }
            }
        } else if (hasError) {
            // ── Error / Offline Recovery Screen ──
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(0xFF0F0F11))
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFF1E1E24), shape = RoundedCornerShape(16.dp))
                        .border(1.dp, Color(0xFF2E2E38), shape = RoundedCornerShape(16.dp))
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text(text = "🕊️ EndoCore Offline", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Bold)
                    Text(
                        text = "UNABLE TO REACH CLOUD SERVICE",
                        color = Color(0xFFD4AF37),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        letterSpacing = 1.2.sp
                    )
                    Text(
                        text = if (errorMessage.isNotEmpty()) errorMessage else "EndoCore is temporarily offline or waking up. Your workstation data is safe.",
                        color = Color(0xFFA0A0B0),
                        fontSize = 12.sp,
                        textAlign = TextAlign.Center
                    )

                    // Render free tier cold start hint
                    if (connectionMode == "cloud") {
                        Text(
                            text = "💡 Render free tier servers sleep after 15 min of inactivity. First load may take 30-60 seconds while the server wakes up.",
                            color = Color(0xFF888888),
                            fontSize = 10.sp,
                            textAlign = TextAlign.Center,
                            lineHeight = 14.sp
                        )
                    }

                    Button(
                        onClick = {
                            hasError = false
                            isPageLoading = true
                            webViewRef?.loadUrl(targetUrl)
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD4AF37), contentColor = Color(0xFF0F0F11)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(44.dp),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Retry Connection", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    }
                    TextButton(onClick = { showSettings = true }) {
                        Text("⚙️ Connection Settings", color = Color(0xFFA0A0B0), fontSize = 11.sp)
                    }
                }
            }
        } else {
            // ── Main WebView ──
            Box(modifier = Modifier.fillMaxSize()) {
                AndroidView(
                    factory = { ctx ->
                        WebView(ctx).apply {
                            webViewRef = this
                            settings.javaScriptEnabled = true
                            settings.domStorageEnabled = true
                            settings.useWideViewPort = true
                            settings.loadWithOverviewMode = true
                            settings.cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
                            // Allow mixed content (needed for loading HTTP resources from HTTPS pages)
                            settings.mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                            // Set a proper user agent to avoid any blocking
                            settings.userAgentString = settings.userAgentString + " EndoCoreApp/1.0"

                            webViewClient = object : WebViewClient() {
                                override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                                    super.onPageStarted(view, url, favicon)
                                    isPageLoading = true
                                }

                                override fun onPageFinished(view: WebView?, url: String?) {
                                    super.onPageFinished(view, url)
                                    isPageLoading = false
                                }

                                override fun onReceivedError(
                                    view: WebView?,
                                    request: WebResourceRequest?,
                                    error: WebResourceError?
                                ) {
                                    super.onReceivedError(view, request, error)
                                    if (request?.isForMainFrame == true) {
                                        hasError = true
                                        errorMessage = error?.description?.toString() ?: "Network error"
                                    }
                                }

                                override fun onReceivedSslError(
                                    view: WebView?,
                                    handler: SslErrorHandler?,
                                    error: SslError?
                                ) {
                                    // For local dev server with self-signed certs, proceed
                                    if (connectionMode == "local") {
                                        handler?.proceed()
                                    } else {
                                        super.onReceivedSslError(view, handler, error)
                                    }
                                }
                            }
                            loadUrl(targetUrl)
                        }
                    },
                    modifier = Modifier.fillMaxSize()
                )

                // Loading overlay while WebView page is loading
                if (isPageLoading) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color(0xFF0F0F11)),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(
                            text = "🕊️ EndoCore",
                            color = Color.White,
                            fontSize = 28.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "LOADING MOBILE WORKSPACE",
                            color = Color(0xFFD4AF37),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.SemiBold,
                            letterSpacing = 1.5.sp
                        )
                        Spacer(modifier = Modifier.height(24.dp))
                        CircularProgressIndicator(
                            color = Color(0xFFD4AF37),
                            modifier = Modifier.size(32.dp),
                            strokeWidth = 2.dp
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        if (connectionMode == "cloud") {
                            Text(
                                text = "Server may take a moment to wake up...",
                                color = Color(0xFF666666),
                                fontSize = 10.sp
                            )
                        }
                    }
                }

                // Floating Settings Button (always visible when WebView is loaded)
                if (!isPageLoading) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        contentAlignment = Alignment.BottomEnd
                    ) {
                        FloatingActionButton(
                            onClick = { showSettings = true },
                            containerColor = Color(0xFF1E1E24),
                            contentColor = Color(0xFFD4AF37),
                            modifier = Modifier.size(48.dp),
                            shape = RoundedCornerShape(24.dp)
                        ) {
                            Text("⚙️", fontSize = 18.sp)
                        }
                    }
                }
            }
        }
    }
}
