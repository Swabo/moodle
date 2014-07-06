<?php

// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Prints a particular instance of threedmodel
 *
 * You can have a rather longer description of the file as well,
 * if you like, and it can span multiple lines.
 *
 * @package    mod_threedmodel
 * @copyright  2011 Your Name
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
/// (Replace threedmodel with the name of your module and remove this line)

require_once(dirname(dirname(dirname(__FILE__))) . '/config.php');
require_once(dirname(__FILE__) . '/lib.php');
require_once($CFG->dirroot . '/mod/threedmodel/locallib.php');
require_once($CFG->libdir . '/completionlib.php');

$id = optional_param('id', 0, PARAM_INT); // course_module ID, or
$t = optional_param('t', 0, PARAM_INT);  // threedmodel instance ID 
$redirect = optional_param('redirect', 0, PARAM_BOOL);

if ($id) {
    $cm = get_coursemodule_from_id('threedmodel', $id, 0, false, MUST_EXIST);
    $course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $threedmodel = $DB->get_record('threedmodel', array('id' => $cm->instance), '*', MUST_EXIST);
} elseif ($t) {
    $threedmodel = $DB->get_record('threedmodel', array('id' => $t), '*', MUST_EXIST);
    $course = $DB->get_record('course', array('id' => $threedmodel->course), '*', MUST_EXIST);
    $cm = get_coursemodule_from_instance('threedmodel', $threedmodel->id, $course->id, false, MUST_EXIST);
} else {
    error('You must specify a course_module ID or an instance ID');
}

require_login($course, true, $cm);
$context = context_module::instance($cm->id);
//require_capability('mod/threedmodel:view', $context);

add_to_log($course->id, 'threedmodel', 'view', "view.php?id={$cm->id}", $threedmodel->name, $cm->id);

/// Print the page header

$PAGE->set_url('/mod/threedmodel/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($threedmodel->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// other things you may want to set - remove if not needed
//$PAGE->set_cacheable(false);
//$PAGE->set_focuscontrol('some-html-id');
//$PAGE->add_body_class('threedmodel-'.$somevar);


$fs = get_file_storage();
$files = $fs->get_area_files($context->id, 'mod_threedmodel', 'content', 0, 'sortorder DESC, id ASC', false); // TODO: this is not very efficient!!


if (count($files) < 1) {
    //resource_print_filenotfound($threedmodel, $cm, $course);
    debugging('keine Dateien gefunden');
    die;
} else {
    $file = reset($files);
    unset($files);
}


if (!isset($_SERVER['HTTP_REFERER']) || strpos($_SERVER['HTTP_REFERER'], 'modedit.php') === false) {
    $redirect = true;
}

if ($redirect) {
// coming from course page or url index page
// this redirect trick solves caching problems when tracking views ;-)
    $path = '/' . $context->id . '/mod_threedmodel/content' . $file->get_filepath() . $file->get_filename();
    $fullurl = moodle_url::make_file_url('/pluginfile.php', $path);
// redirect($fullurl);
}


// Output starts here
echo $OUTPUT->header();

//if ($threedmodel->intro) { // Conditions to show the intro can change to look for own settings or whatever
//    echo $OUTPUT->box(format_module_intro('threedmodel', $threedmodel, $cm->id), 'generalbox mod_introbox', 'threedmodelintro');
//}
// Replace the following lines with you own code
echo $OUTPUT->heading('Yay! It works!');



echo "<div id='threedmodelContainer'></div>";
$PAGE->requires->js( new moodle_url($CFG->wwwroot . '/mod/threedmodel/lib/three.min.js') );
$PAGE->requires->js( new moodle_url($CFG->wwwroot . '/mod/threedmodel/lib/ColladaLoader.js') );

$PAGE->requires->js_init_call('M.mod_threedmodel.init', array((string)$fullurl));


// Finish the page
echo $OUTPUT->footer();
