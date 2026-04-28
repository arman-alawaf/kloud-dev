<?php

declare(strict_types=1);

require __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

function envStr(string $key, string $default = ''): string
{
    $v = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);
    if ($v === false || $v === null) {
        return $default;
    }
    return is_string($v) ? trim($v, " \t\n\r\x0B\"") : (string) $v;
}

$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Browsers need this when the site (e.g. GitHub Pages) POSTs to your PHP on another host.
$originsCsv = envStr('CALLBACK_ALLOWED_ORIGINS', '');
if ($originsCsv === '') {
    $single = envStr('CALLBACK_ALLOWED_ORIGIN', '');
    if ($single !== '') {
        $originsCsv = $single;
    }
}
$allowedOrigins = array_values(array_filter(array_map('trim', explode(',', $originsCsv))));
$requestOrigin = isset($_SERVER['HTTP_ORIGIN']) ? trim((string) $_SERVER['HTTP_ORIGIN']) : '';
foreach ($allowedOrigins as $allowed) {
    if ($allowed !== '' && $requestOrigin !== '' && strcasecmp($requestOrigin, $allowed) === 0) {
        header('Access-Control-Allow-Origin: ' . $requestOrigin);
        header('Vary: Origin');
        break;
    }
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

if ($requestMethod === 'OPTIONS') {
    http_response_code(204);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

if ($requestMethod !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$host = envStr('MAIL_HOST');
$user = envStr('MAIL_USERNAME');
$pass = envStr('MAIL_PASSWORD');
$from = envStr('MAIL_FROM_ADDRESS');
$fromName = envStr('MAIL_FROM_NAME', 'Kloud Website');
$port = (int) envStr('MAIL_PORT', '465');
$encryption = strtolower(envStr('MAIL_ENCRYPTION', 'ssl'));

$recipientsRaw = envStr(
    'CALLBACK_RECIPIENTS',
    'arman.alawaf@gmail.com,arman.p2c@gmail.com'
);
$recipients = array_values(array_filter(array_map('trim', explode(',', $recipientsRaw)), static fn ($e) => $e !== ''));
$recipients = array_values(array_filter($recipients, static fn ($e) => filter_var($e, FILTER_VALIDATE_EMAIL)));

if ($host === '' || $user === '' || $pass === '' || $from === '' || $recipients === []) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Mail is not configured on the server.']);
    exit;
}

$input = $_POST;

$fullName = isset($input['fullName']) ? trim((string) $input['fullName']) : '';
$phone = isset($input['phone']) ? preg_replace('/\s+/', '', (string) $input['phone']) : '';
$email = isset($input['email']) ? trim((string) $input['email']) : '';
$address = isset($input['address']) ? trim((string) $input['address']) : '';
$package = isset($input['package']) ? trim((string) $input['package']) : '';

$packageLabels = [
    'mini' => 'Kloud Mini - 699 BDT',
    'stream' => 'Kloud Stream - 899 BDT',
    'neo' => 'Kloud Neo - 999 BDT',
    'boost' => 'Kloud Boost + - 1499 BDT',
    'edge' => 'Kloud Edge - 1899 BDT',
];

$errors = [];

if ($fullName === '' || strlen($fullName) > 200) {
    $errors[] = 'Please enter your full name.';
}
if (!preg_match('/^01[0-9]{9}$/', $phone)) {
    $errors[] = 'Please enter a valid Bangladesh mobile number.';
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Please enter a valid email address.';
}
if ($address === '' || strlen($address) > 500) {
    $errors[] = 'Please enter your address.';
}
if ($package === '' || !isset($packageLabels[$package])) {
    $errors[] = 'Please select a package.';
}

if ($errors !== []) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => implode(' ', $errors)]);
    exit;
}

$packageLabel = $packageLabels[$package];
$subject = 'Kloud callback request — ' . $packageLabel;

$safeName = htmlspecialchars($fullName, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$safePhone = htmlspecialchars($phone, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$safeEmail = htmlspecialchars($email, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$safeAddress = htmlspecialchars($address, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$safePackage = htmlspecialchars($packageLabel, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

$htmlBody = <<<HTML
<p><strong>New callback request</strong> from the website form.</p>
<table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
<tr><td><strong>Name</strong></td><td>{$safeName}</td></tr>
<tr><td><strong>Phone</strong></td><td>{$safePhone}</td></tr>
<tr><td><strong>Email</strong></td><td>{$safeEmail}</td></tr>
<tr><td><strong>Address</strong></td><td>{$safeAddress}</td></tr>
<tr><td><strong>Package</strong></td><td>{$safePackage}</td></tr>
</table>
HTML;

$textBody = implode("\n", [
    'New callback request from the website form.',
    '',
    'Name: ' . $fullName,
    'Phone: ' . $phone,
    'Email: ' . $email,
    'Address: ' . $address,
    'Package: ' . $packageLabel,
]);

$mail = new PHPMailer\PHPMailer\PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host = $host;
    $mail->SMTPAuth = true;
    $mail->Username = $user;
    $mail->Password = $pass;
    if ($encryption === 'tls') {
        $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
    } else {
        $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
    }
    $mail->Port = $port > 0 ? $port : 465;
    $mail->CharSet = 'UTF-8';

    $mail->setFrom($from, $fromName);
    foreach ($recipients as $to) {
        $mail->addAddress($to);
    }
    $mail->addReplyTo($email, $fullName !== '' ? $fullName : $email);

    $mail->isHTML(true);
    $mail->Subject = $subject;
    $mail->Body = $htmlBody;
    $mail->AltBody = $textBody;

    $mail->send();
} catch (Throwable $e) {
    error_log('send-callback mail error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Could not send your request. Please try again later or call us.']);
    exit;
}

echo json_encode(['ok' => true, 'message' => 'Thank you. We will contact you soon.']);
