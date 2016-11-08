<?php

	include ('./lib/Alb/OEmbed/Discovery.php');
	include ('./lib/Alb/OEmbed/Response.php');
	include ('./lib/Alb/OEmbed/Provider.php');
	include ('./lib/Alb/OEmbed/Simple.php');
	
	use Alb\OEmbed;
	
	$valid_url_regex = '/.*/';

	$url = $_GET['url'];

	if ( !$url ) {  
	  // Passed url not specified.
	  echo 'ERROR: url not specified';
	  
	} else if ( !preg_match( $valid_url_regex, $url ) ) {
	  
	  // Passed url doesn't match $valid_url_regex.
	  echo 'ERROR: invalid url';
	  
	} else {
		
		
		$embed = OEmbed\Simple::request($url, array(
			'maxwidth' => 400,
			'maxheight' => 300,
		));
		
		if ($embed) {
			$response = array(
				'title' => $embed->getTitle(),
				'html' => $embed->getHtml(),
			);
			header('Content-type: application/json');

			echo json_encode($response);
		}	else {
			
			$response = array(
				'error' => true,
				'code' => null,
			);
			header('Content-type: application/json');

			echo json_encode($response);
		}		
			 
	}
