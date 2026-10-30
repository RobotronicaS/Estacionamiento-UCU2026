param(
    [Parameter(Mandatory=$true)][string]$BuildTools,
    [Parameter(Mandatory=$true)][string]$AndroidJar,
    [Parameter(Mandatory=$true)][string]$JdkRoot,
    [string]$OutputPath = (Join-Path $PSScriptRoot 'dist\Estaciona-Salto-UCU-0.1.3.apk')
)
$ErrorActionPreference = 'Stop'
$buildRoot = Join-Path $PSScriptRoot ('build\' + [Guid]::NewGuid().ToString('N'))
$taskJava = Join-Path $JdkRoot 'bin\java.exe'
$taskJavac = Join-Path $JdkRoot 'bin\javac.exe'
$taskKeytool = Join-Path $JdkRoot 'bin\keytool.exe'
$taskAapt = Join-Path $BuildTools 'aapt.exe'
$taskSigning = Join-Path $PSScriptRoot 'signing'
$taskKeystore = Join-Path $taskSigning 'classroom.keystore'
foreach ($requiredFile in @($taskJava,$taskJavac,$taskKeytool,$taskAapt,$AndroidJar)) {
    if (!(Test-Path -LiteralPath $requiredFile -PathType Leaf)) { throw "Falta una herramienta: $requiredFile" }
}
$OutputPath = [IO.Path]::GetFullPath($OutputPath)
New-Item -ItemType Directory -Force -Path $buildRoot,(Join-Path $buildRoot 'classes'),$taskSigning,([IO.Path]::GetDirectoryName($OutputPath)) | Out-Null
function Invoke-Checked([string]$Executable,[string[]]$Arguments) {
    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) { throw "Fallo de compilación ($LASTEXITCODE): $Executable" }
}
if (!(Test-Path -LiteralPath $taskKeystore)) {
    # Clave de desarrollo para esta app nueva; no se usa la firma de otras APK.
    Invoke-Checked $taskKeytool @('-genkeypair','-keystore',$taskKeystore,'-storepass','android','-keypass','android','-alias','androiddebugkey','-keyalg','RSA','-keysize','2048','-validity','10000','-dname','CN=Estaciona Salto Classroom, O=Proyecto Integrador 2, C=UY')
}
Invoke-Checked $taskAapt @('package','-f','-M',(Join-Path $PSScriptRoot 'AndroidManifest.xml'),'-S',(Join-Path $PSScriptRoot 'res'),'-A',(Join-Path $PSScriptRoot 'assets'),'-I',$AndroidJar,'-F',(Join-Path $buildRoot 'resources.apk'))
Invoke-Checked $taskJavac @('-encoding','UTF-8','-source','1.7','-target','1.7','-bootclasspath',$AndroidJar,'-d',(Join-Path $buildRoot 'classes'),(Join-Path $PSScriptRoot 'src\uy\edu\ucu\estacionasalto\MainActivity.java'))
$dxJar = Join-Path $BuildTools 'lib\dx.jar'
if (Test-Path -LiteralPath $dxJar) {
    Invoke-Checked $taskJava @('-jar',$dxJar,'--dex',('--output=' + (Join-Path $buildRoot 'classes.dex')),(Join-Path $buildRoot 'classes'))
} else {
    $classesJar = Join-Path $buildRoot 'classes.jar'
    Invoke-Checked (Join-Path $JdkRoot 'bin\jar.exe') @('cf',$classesJar,'-C',(Join-Path $buildRoot 'classes'),'.')
    Invoke-Checked $taskJava @('-cp',(Join-Path $BuildTools 'lib\d8.jar'),'com.android.tools.r8.D8','--min-api','26','--lib',$AndroidJar,'--output',$buildRoot,$classesJar)
}
Push-Location $buildRoot
try { Invoke-Checked $taskAapt @('add','resources.apk','classes.dex') } finally { Pop-Location }
Invoke-Checked (Join-Path $BuildTools 'zipalign.exe') @('-f','4',(Join-Path $buildRoot 'resources.apk'),(Join-Path $buildRoot 'aligned.apk'))
Invoke-Checked $taskJava @('-jar',(Join-Path $BuildTools 'lib\apksigner.jar'),'sign','--ks',$taskKeystore,'--ks-key-alias','androiddebugkey','--ks-pass','pass:android','--key-pass','pass:android','--out',$OutputPath,(Join-Path $buildRoot 'aligned.apk'))
Invoke-Checked $taskJava @('-jar',(Join-Path $BuildTools 'lib\apksigner.jar'),'verify','--verbose','--print-certs',$OutputPath)
Invoke-Checked $taskAapt @('dump','badging',$OutputPath)
Write-Output ('APK SHA256: ' + (Get-FileHash -LiteralPath $OutputPath -Algorithm SHA256).Hash)
Write-Output ('APK: ' + $OutputPath)
