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

    val defaultCloudUrl = "https://endocore-workspace.vercel.app?platform=mobile"
    var ipAddress by remember { mutableStateOf(sharedPref.getString("ip_address", "") ?: "") }
    var port by remember { mutableStateOf(sharedPref.getString("port", "3000") ?: "3000") }
    var isConnected by remember { mutableStateOf(true) }
    var hasError by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf("") }
    var webViewRef by remember { mutableStateOf<WebView?>(null) }
    var isLoading by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()

    val targetUrl = if (ipAddress.trim().isNotEmpty()) {
        "http://${ipAddress.trim()}:${port.trim()}?platform=mobile"
    } else {
        defaultCloudUrl
    }

    Box(modifier = Modifier.fillMaxSize()) {
        if (isConnected) {
            if (hasError) {
                // Friendly Native Offline / Reconnect Recovery Screen
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
                        Button(
                            onClick = {
                                hasError = false
                                webViewRef?.reload()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD4AF37), contentColor = Color(0xFF0F0F11)),
                            modifier = Modifier.fillMaxWidth().height(44.dp),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Retry Connection", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                        TextButton(onClick = { isConnected = false }) {
                            Text("Configure Custom Server IP", color = Color(0xFFA0A0B0), fontSize = 11.sp)
                        }
                    }
                }
            } else {
                // Full Screen Native WebView
                AndroidView(
                    factory = { ctx ->
                        WebView(ctx).apply {
                            webViewRef = this
                            settings.javaScriptEnabled = true
                            settings.domStorageEnabled = true
                            settings.useWideViewPort = true
                            settings.loadWithOverviewMode = true
                            settings.cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
                            webViewClient = object : WebViewClient() {
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
                            }
                            loadUrl(targetUrl)
                        }
                    },
                    modifier = Modifier.fillMaxSize()
                )

                // Floating Settings Button
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(24.dp),
                    contentAlignment = Alignment.BottomEnd
                ) {
                    FloatingActionButton(
                        onClick = { isConnected = false },
                        containerColor = Color(0xFF1E1E24),
                        contentColor = Color(0xFFD4AF37),
                        modifier = Modifier.size(48.dp),
                        shape = RoundedCornerShape(24.dp)
                    ) {
                        Text("⚙️", fontSize = 18.sp)
                    }
                }
            }
        } else {
            // Setup Screen
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(0xFF0F0F11))
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                // Config Card container
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
                        text = "MOBILE WORKSPACE PIPELINE",
                        color = Color(0xFFD4AF37), // Golden Theme
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
                            value = ipAddress,
                            onValueChange = { ipAddress = it },
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
                            value = port,
                            onValueChange = { port = it },
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

                    // Connect button
                    Button(
                        onClick = {
                            if (ipAddress.trim().isEmpty()) {
                                return@Button
                            }
                            // Persist credentials locally
                            sharedPref.edit()
                                .putString("ip_address", ipAddress)
                                .putString("port", port)
                                .apply()

                            isLoading = true
                            coroutineScope.launch {
                                delay(800) // Mock latency connection check
                                isLoading = false
                                isConnected = true
                            }
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFFD4AF37),
                            contentColor = Color(0xFF0F0F11)
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        shape = RoundedCornerShape(8.dp),
                        enabled = !isLoading
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                color = Color(0xFF0F0F11),
                                modifier = Modifier.size(24.dp)
                            )
                        } else {
                            Text("Connect Workspace", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        }
                    }

                    Text(
                        text = "Ensure your PC and phone are connected to the same Wi-Fi network and that the Express server is running.",
                        color = Color(0xFF666666),
                        fontSize = 11.sp,
                        textAlign = TextAlign.Center,
                        lineHeight = 16.sp
                    )
                }
            }
        }
    }
}
