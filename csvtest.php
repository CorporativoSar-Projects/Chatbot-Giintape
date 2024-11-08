<?php

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get the content of the request body
    $content = file_get_contents('php://input');
    $decoded = json_decode($content, true);
    
    
    $email = isset($decoded['email']) ? $decoded['email'] : '';

    
    $csvFile = 'report_Candidate_status_test.csv';
    $handle = fopen($csvFile, 'r');

    
    if ($handle !== false) {
        
        $matches = [];

        
        fgetcsv($handle);

        // Iterate through each line of the CSV file
        while (($data = fgetcsv($handle)) !== false) {
            // Check if the email matches
            if ($data[5] === $email) { // Assuming the email is in column 5
                // Store the row data as a match
                $matches[] = [
                    'puesto' => $data[1],
                    'nombre' => $data[3],
                    'apellido'=> $data[4], 
                    'correo' => $data[5], 
                    'estatus' => $data[8] 
                ];
            }
        }

        // Close the CSV file
        fclose($handle);

        // Return the matching data as JSON
        header('Content-Type: application/json');
        echo json_encode($matches);
    } else {
        // If the CSV file could not be opened, return an error message
        echo json_encode(['error' => 'No se pudo abrir el archivo CSV.']);
    }
} else {
    // If no POST request was received, return an error message
    echo json_encode(['error' => 'Solicitud no válida.']);
}
?>