package com.endocore.app

import android.content.Context
import android.graphics.Bitmap
import android.net.http.SslError
import android.os.Bundle
import android.webkit.SslErrorHandler
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
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

// ── Ultra-Premium Designer Palette ──
val BgDark = Color(0xFF030305)
val BgGradientBottom = Color(0xFF101015)
// Glassmorphism surface
val GlassSurface = Color(0xFFFFFFFF).copy(alpha = 0.03f)
val GlassBorder = Color(0xFFFFFFFF).copy(alpha = 0.1f)

// Dynamic multi-stop gradients
val NeonPurple = Color(0xFF8B5CF6)
val NeonPink = Color(0xFFD946EF)
val NeonGold = Color(0xFFF59E0B)

val TextPrimary = Color(0xFFFFFFFF)
val TextSecondary = Color(0xFFA1A1AA)

@Composable
fun EndoCoreApp() {
    val context = LocalContext.current
    val sharedPref = remember { context.getSharedPreferences("EndoCorePrefs", Context.MODE_PRIVATE) }

    val cloudUrl = "https://endocore-workspace.onrender.com?platform=mobile"

    var connectionMode by remember {
        mutableStateOf(sharedPref.getString("connection_mode", "cloud") ?: "cloud")
    }
    var localIp by remember { mutableStateOf(sharedPref.getString("ip_address", "") ?: "") }
    var localPort by remember { mutableStateOf(sharedPref.getString("port", "3000") ?: "3000") }

    var showSettings by remember { mutableStateOf(false) }
    var hasError by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf("") }
    var webViewRef by remember { mutableStateOf<WebView?>(null) }
    var isPageLoading by remember { mutableStateOf(true) }
    var isLoading by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()

    val targetUrl = if (connectionMode == "local" && localIp.trim().isNotEmpty()) {
        "http://${localIp.trim()}:${localPort.trim()}?platform=mobile"
    } else {
        cloudUrl
    }

    // ── Infinite Animations for Glow & Mesh Gradient ──
    val infiniteTransition = rememberInfiniteTransition()
    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.8f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        )
    )
    val bgOffset by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1000f,
        animationSpec = infiniteRepeatable(
            animation = tween(15000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        )
    )

    val DynamicMeshGradient = Brush.linearGradient(
        colors = listOf(NeonPurple.copy(alpha=glowAlpha), BgDark, NeonPink.copy(alpha=glowAlpha*0.5f), BgGradientBottom),
        start = Offset(bgOffset, 0f),
        end = Offset(0f, bgOffset)
    )
    
    val DynamicButtonGradient = Brush.horizontalGradient(
        colors = listOf(NeonPurple, NeonPink, NeonGold)
    )

    Box(modifier = Modifier.fillMaxSize().background(DynamicMeshGradient)) {
        AnimatedVisibility(
            visible = showSettings,
            enter = fadeIn(tween(600)) + slideInVertically(initialOffsetY = { 80 }, animationSpec = tween(600, easing = EaseOutQuart)),
            exit = fadeOut(tween(400)) + slideOutVertically(targetOffsetY = { 80 }, animationSpec = tween(400))
        ) {
            // ── Settings / Connection Configuration Screen ──
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .shadow(32.dp, RoundedCornerShape(32.dp), spotColor = NeonPurple.copy(alpha=0.5f))
                        .clip(RoundedCornerShape(32.dp))
                        .background(GlassSurface)
                        .border(1.dp, GlassBorder, RoundedCornerShape(32.dp))
                        .padding(32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(24.dp)
                ) {
                    // Title Typography
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "EndoCore",
                            color = TextPrimary,
                            fontSize = 36.sp,
                            fontFamily = FontFamily.SansSerif,
                            fontWeight = FontWeight.Black,
                            textAlign = TextAlign.Center,
                            letterSpacing = (-1.5).sp
                        )
                        Text(
                            text = "WORKSPACE CONNECTION",
                            color = NeonPink,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 3.sp,
                            textAlign = TextAlign.Center
                        )
                    }

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(1.dp)
                            .background(Brush.horizontalGradient(listOf(Color.Transparent, GlassBorder, Color.Transparent)))
                    )

                    // ── Cloud Connection Button with Micro-Animation ──
                    val cloudInteraction = remember { MutableInteractionSource() }
                    val isCloudPressed by cloudInteraction.collectIsPressedAsState()
                    val cloudScale by animateFloatAsState(if (isCloudPressed) 0.95f else 1f)

                    Button(
                        onClick = {
                            connectionMode = "cloud"
                            sharedPref.edit().putString("connection_mode", "cloud").apply()
                            showSettings = false
                            hasError = false
                            isPageLoading = true
                            webViewRef?.loadUrl(cloudUrl)
                        },
                        interactionSource = cloudInteraction,
                        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                        contentPadding = PaddingValues(),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp)
                            .scale(cloudScale)
                            .clip(RoundedCornerShape(16.dp)),
                        elevation = ButtonDefaults.buttonElevation(0.dp, 0.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(if (connectionMode == "cloud") DynamicButtonGradient else Brush.horizontalGradient(listOf(GlassBorder, GlassBorder))),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                "☁️  Connect to Cloud",
                                color = TextPrimary,
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 16.sp,
                                letterSpacing = 0.5.sp
                            )
                        }
                    }

                    Text(
                        text = "Recommended. Works on any network instantly.",
                        color = TextSecondary,
                        fontSize = 13.sp,
                        textAlign = TextAlign.Center,
                        fontWeight = FontWeight.Medium
                    )

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(1.dp)
                            .background(Brush.horizontalGradient(listOf(Color.Transparent, GlassBorder, Color.Transparent)))
                    )

                    Text(
                        text = "LOCAL DEV SERVER",
                        color = TextSecondary.copy(alpha = 0.6f),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = 2.sp
                    )

                    // Glassmorphic Input
                    OutlinedTextField(
                        value = localIp,
                        onValueChange = { localIp = it },
                        placeholder = { Text("192.168.1.x", color = TextSecondary.copy(alpha=0.4f)) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary,
                            focusedBorderColor = NeonPink,
                            unfocusedBorderColor = GlassBorder,
                            focusedContainerColor = Color(0xFF000000).copy(alpha=0.4f),
                            unfocusedContainerColor = Color(0xFF000000).copy(alpha=0.2f),
                            cursorColor = NeonPink
                        ),
                        shape = RoundedCornerShape(16.dp),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Local IP Address", color = TextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Medium) }
                    )

                    // ── Local Connect Button with Micro-Animation ──
                    val localInteraction = remember { MutableInteractionSource() }
                    val isLocalPressed by localInteraction.collectIsPressedAsState()
                    val localScale by animateFloatAsState(if (isLocalPressed) 0.95f else 1f)

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
                                delay(600)
                                isLoading = false
                                showSettings = false
                                hasError = false
                                isPageLoading = true
                                val localUrl = "http://${localIp.trim()}:${localPort.trim()}?platform=mobile"
                                webViewRef?.loadUrl(localUrl)
                            }
                        },
                        interactionSource = localInteraction,
                        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                        contentPadding = PaddingValues(),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp)
                            .scale(localScale)
                            .clip(RoundedCornerShape(16.dp)),
                        enabled = !isLoading
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(if (connectionMode == "local") DynamicButtonGradient else Brush.horizontalGradient(listOf(Color(0xFF1E1E24), Color(0xFF1E1E24))))
                                .border(1.dp, GlassBorder, RoundedCornerShape(16.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            if (isLoading) {
                                CircularProgressIndicator(color = TextPrimary, modifier = Modifier.size(24.dp), strokeWidth = 2.dp)
                            } else {
                                Text("🖥️  Local Sync", color = TextPrimary, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, letterSpacing = 0.5.sp)
                            }
                        }
                    }
                }
            }
        }
        
        if (hasError && !showSettings) {
            // ── Error Screen ──
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .shadow(24.dp, RoundedCornerShape(32.dp), spotColor = Color.Red.copy(alpha=0.5f))
                        .clip(RoundedCornerShape(32.dp))
                        .background(GlassSurface)
                        .border(1.dp, GlassBorder, RoundedCornerShape(32.dp))
                        .padding(32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(20.dp)
                ) {
                    Text(text = "Connection Lost", color = TextPrimary, fontSize = 28.sp, fontWeight = FontWeight.Black, letterSpacing = (-1).sp)
                    Text(
                        text = "UNABLE TO REACH WORKSPACE",
                        color = Color(0xFFEF4444),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.5.sp
                    )
                    Text(
                        text = if (errorMessage.isNotEmpty()) errorMessage else "Please verify your network connection or server status.",
                        color = TextSecondary,
                        fontSize = 14.sp,
                        textAlign = TextAlign.Center
                    )

                    Button(
                        onClick = {
                            hasError = false
                            isPageLoading = true
                            webViewRef?.loadUrl(targetUrl)
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                        contentPadding = PaddingValues(),
                        modifier = Modifier.fillMaxWidth().height(52.dp).clip(RoundedCornerShape(16.dp))
                    ) {
                        Box(
                            modifier = Modifier.fillMaxSize().background(DynamicButtonGradient),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("Retry Connection", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        }
                    }
                    TextButton(onClick = { showSettings = true }) {
                        Text("⚙️ Configure Settings", color = TextSecondary, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                    }
                }
            }
        } else if (!showSettings && !hasError) {
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
                            settings.mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
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

                                override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                                    super.onReceivedError(view, request, error)
                                    if (request?.isForMainFrame == true) {
                                        hasError = true
                                        errorMessage = error?.description?.toString() ?: "Network error"
                                    }
                                }

                                override fun onReceivedSslError(view: WebView?, handler: SslErrorHandler?, error: SslError?) {
                                    if (connectionMode == "local") handler?.proceed() else super.onReceivedSslError(view, handler, error)
                                }
                            }
                            loadUrl(targetUrl)
                        }
                    },
                    modifier = Modifier.fillMaxSize()
                )

                // Glass Loading Overlay
                AnimatedVisibility(
                    visible = isPageLoading,
                    enter = fadeIn(tween(400)),
                    exit = fadeOut(tween(600))
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color(0xFF000000).copy(alpha=0.7f)),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text("EndoCore", color = TextPrimary, fontSize = 36.sp, fontWeight = FontWeight.Black, letterSpacing = (-1).sp)
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("ESTABLISHING SECURE LINK", color = NeonPink, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 3.sp)
                        Spacer(modifier = Modifier.height(40.dp))
                        CircularProgressIndicator(color = NeonPurple, modifier = Modifier.size(48.dp), strokeWidth = 4.dp)
                    }
                }

                // Floating Settings Button (Glassmorphic)
                if (!isPageLoading) {
                    Box(
                        modifier = Modifier.fillMaxSize().padding(24.dp),
                        contentAlignment = Alignment.BottomEnd
                    ) {
                        FloatingActionButton(
                            onClick = { showSettings = true },
                            containerColor = GlassSurface,
                            contentColor = TextPrimary,
                            modifier = Modifier
                                .size(64.dp)
                                .shadow(16.dp, CircleShape, spotColor = NeonPurple)
                                .border(1.dp, GlassBorder, CircleShape),
                            shape = CircleShape,
                            elevation = FloatingActionButtonDefaults.elevation(0.dp)
                        ) {
                            Text("⚙️", fontSize = 24.sp)
                        }
                    }
                }
            }
        }
    }
}
